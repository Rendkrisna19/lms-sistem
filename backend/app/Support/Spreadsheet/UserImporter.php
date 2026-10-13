<?php

namespace App\Support\Spreadsheet;

use App\Models\Classroom;
use App\Models\User;
use App\Support\UserProfile;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;

/**
 * Membaca dan memvalidasi berkas Excel data guru atau siswa.
 * Seluruh pemeriksaan dilakukan sebelum data ditulis: satu baris salah berarti tidak ada yang tersimpan.
 */
final class UserImporter
{
    /** @var Collection<string, Classroom> kode kelas (huruf besar) => kelas */
    private Collection $classrooms;

    /** @var list<array{row: int, column: string, message: string}> */
    private array $errors = [];

    public function __construct(private readonly string $role, private readonly int $schoolId)
    {
        $this->classrooms = Classroom::where('school_id', $schoolId)
            ->get()
            ->keyBy(fn (Classroom $classroom) => strtoupper(trim($classroom->code)));
    }

    /**
     * @return array{total: int, valid: int, rows: list<array<string, mixed>>, errors: list<array{row: int, column: string, message: string}>}
     */
    public function analyze(string $path): array
    {
        $layout = UserSheetLayout::for($this->role);
        $spreadsheet = IOFactory::load($path);
        $sheet = $spreadsheet->getSheetByName($layout['sheet']) ?? $spreadsheet->getSheet(0);

        // Nilai yang tampil (formatted) agar NIP berbentuk teks, bukan angka mentah
        $matrix = $sheet->toArray(null, true, true, false);
        $headerRow = array_shift($matrix) ?? [];
        $columnIndex = $this->mapColumns($headerRow, $layout['columns']);

        $missing = [];
        foreach ($layout['columns'] as $column) {
            if (($column['required'] ?? false) && !array_key_exists($column['key'], $columnIndex)) {
                $missing[] = ['row' => 1, 'column' => $column['header'], 'message' => "Kolom \"{$column['header']}\" tidak ditemukan. Gunakan template terbaru dari sistem."];
            }
        }
        if ($missing) {
            return ['total' => 0, 'valid' => 0, 'rows' => [], 'errors' => $missing];
        }

        $entries = [];
        foreach ($matrix as $offset => $cells) {
            $values = $this->extract($cells, $columnIndex);
            if (collect($values)->every(fn ($value) => $value === '')) {
                continue; // baris kosong dilewati
            }
            $entries[] = ['row' => $offset + 2, 'values' => $values];
        }

        if (count($entries) > UserTemplate::INPUT_ROWS) {
            return [
                'total' => count($entries),
                'valid' => 0,
                'rows' => [],
                'errors' => [['row' => 1, 'column' => '-', 'message' => 'Maksimal ' . UserTemplate::INPUT_ROWS . ' baris per berkas. Berkas ini berisi ' . count($entries) . ' baris.']],
            ];
        }

        $this->errors = [];
        $rows = [];
        $seenIdentifiers = [];
        $seenEmails = [];

        foreach ($entries as $entry) {
            $row = $this->validateEntry($entry['row'], $entry['values'], $layout['columns'], $seenIdentifiers, $seenEmails);
            if ($row !== null) {
                $rows[] = $row;
            }
        }

        return [
            'total' => count($entries),
            'valid' => count($rows),
            'rows' => $rows,
            'errors' => $this->errors,
        ];
    }

    /**
     * @param  array<int, mixed>  $headerRow
     * @param  list<array<string, mixed>>  $columns
     * @return array<string, int> kunci kolom => indeks kolom (0-based)
     */
    private function mapColumns(array $headerRow, array $columns): array
    {
        $aliases = [];
        foreach ($columns as $column) {
            $aliases[UserSheetLayout::normalizeHeader($column['header'])] = $column['key'];
        }
        foreach (['NIP', 'NIS', 'Nomor Induk'] as $alias) {
            $aliases[UserSheetLayout::normalizeHeader($alias)] = 'nomor_induk';
        }
        $aliases[UserSheetLayout::normalizeHeader('Password')] = 'password';

        $map = [];
        foreach ($headerRow as $index => $label) {
            $key = $aliases[UserSheetLayout::normalizeHeader((string) $label)] ?? null;
            if ($key !== null && !array_key_exists($key, $map)) {
                $map[$key] = $index;
            }
        }

        return $map;
    }

    /**
     * @param  array<int, mixed>  $cells
     * @param  array<string, int>  $columnIndex
     * @return array<string, string>
     */
    private function extract(array $cells, array $columnIndex): array
    {
        $values = [];
        foreach ($columnIndex as $key => $index) {
            $values[$key] = trim((string) ($cells[$index] ?? ''));
        }

        return $values;
    }

    /**
     * Normalisasi satu baris lalu validasi. Mengembalikan baris siap simpan, atau null bila ada kesalahan.
     *
     * @param  array<string, string>  $values
     * @param  list<array<string, mixed>>  $columns
     * @param  array<string, true>  $seenIdentifiers
     * @param  array<string, true>  $seenEmails
     * @return array<string, mixed>|null
     */
    private function validateEntry(int $rowNumber, array $values, array $columns, array &$seenIdentifiers, array &$seenEmails): ?array
    {
        $labels = collect($columns)->mapWithKeys(fn ($column) => [$column['key'] => $column['header']])->all();
        $identifierLabel = UserSheetLayout::for($this->role)['identifier'];
        $errorsBefore = count($this->errors);

        $data = [];
        foreach ($columns as $column) {
            $key = $column['key'];
            if (!array_key_exists($key, $values)) {
                continue;
            }
            $data[$key] = $this->normalize($rowNumber, $column, $values[$key]);
        }

        // Kode kelas: harus cocok dengan kelas milik sekolah ini
        $classroomId = null;
        if (!empty($data['classroom_code'] ?? null)) {
            $classroom = $this->classrooms->get(strtoupper((string) $data['classroom_code']));
            if (!$classroom) {
                $this->addError($rowNumber, $labels['classroom_code'], "Kode kelas \"{$data['classroom_code']}\" tidak ditemukan di sekolah ini.");
            } else {
                $classroomId = $classroom->id;
            }
        }

        $validator = Validator::make($data, array_merge([
            'name' => ['required', 'string', 'max:255'],
            'nomor_induk' => ['required', 'string', 'max:50'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'max:100'],
        ], UserProfile::rules($this->role)), [
            'required' => ':attribute wajib diisi.',
            'email' => 'Format email tidak valid.',
            'password.min' => 'Kata sandi minimal 8 karakter.',
            'max' => 'Terlalu panjang.',
            'in' => 'Pilih nilai dari daftar yang tersedia.',
            'date' => 'Format tanggal tidak valid. Gunakan yyyy-mm-dd.',
            'before' => 'Tanggal harus sebelum hari ini.',
            'integer' => 'Harus berupa angka tahun.',
            'between' => 'Tahun harus antara 2000 dan 2100.',
            'regex' => 'Hanya boleh berisi angka, spasi, +, -, (, atau ).',
        ]);

        foreach ($validator->errors()->messages() as $field => $messages) {
            $this->addError($rowNumber, $labels[$field] ?? $field, $messages[0]);
        }

        // Duplikat di dalam berkas yang sama
        $identifier = (string) ($data['nomor_induk'] ?? '');
        if ($identifier !== '') {
            $key = strtolower($identifier);
            if (isset($seenIdentifiers[$key])) {
                $this->addError($rowNumber, $identifierLabel, "{$identifierLabel} {$identifier} sudah ada di baris lain pada berkas ini.");
            }
            $seenIdentifiers[$key] = true;

            if ($this->identifierExists($identifier)) {
                $this->addError($rowNumber, $identifierLabel, "{$identifierLabel} {$identifier} sudah terdaftar di sistem.");
            }
        }

        $email = strtolower((string) ($data['email'] ?? ''));
        if ($email !== '') {
            if (isset($seenEmails[$email])) {
                $this->addError($rowNumber, $labels['email'], "Email {$email} sudah ada di baris lain pada berkas ini.");
            }
            $seenEmails[$email] = true;

            if (User::whereRaw('LOWER(email) = ?', [$email])->exists()) {
                $this->addError($rowNumber, $labels['email'], "Email {$email} sudah digunakan akun lain.");
            }
        }

        if (count($this->errors) > $errorsBefore) {
            return null;
        }

        return array_merge($data, [
            'row' => $rowNumber,
            'nomor_induk' => $identifier,
            'email' => $email,
            'classroom_id' => $classroomId,
        ]);
    }

    /**
     * Mengubah teks dari Excel menjadi nilai yang disimpan, sesuai tipe kolom.
     * Nilai yang tidak bisa diubah dikembalikan apa adanya agar validasi menolaknya dengan pesan yang jelas.
     */
    private function normalize(int $rowNumber, array $column, string $raw): mixed
    {
        if ($raw === '') {
            return null;
        }

        $label = $column['header'];
        $key = $column['key'];

        if (in_array($column['type'], ['identifier'], true) && preg_match('/\d[eE][+-]?\d/', $raw)) {
            $this->addError($rowNumber, $label, "{$label} terbaca sebagai angka (notasi ilmiah). Ubah format kolom menjadi Text lalu isi ulang.");

            return $raw;
        }

        return match ($column['type']) {
            'date' => $this->normalizeDate($rowNumber, $label, $raw),
            'select' => $this->normalizeSelect($rowNumber, $column, $raw),
            'number' => ctype_digit($raw) ? (int) $raw : $raw,
            default => $raw,
        };
    }

    private function normalizeDate(int $rowNumber, string $label, string $raw): string
    {
        foreach (['Y-m-d', 'd/m/Y', 'd-m-Y', 'j/n/Y'] as $format) {
            // Hanya terima bila tanggal tersebut ada (mis. 31-02 ditolak) dan tulisannya persis sama
            $date = \DateTimeImmutable::createFromFormat('!' . $format, $raw);
            if ($date !== false && $date->format($format) === $raw) {
                return $date->format('Y-m-d');
            }
        }
        $this->addError($rowNumber, $label, 'Format tanggal tidak valid. Gunakan yyyy-mm-dd, misalnya 1985-07-15.');

        return $raw;
    }

    private function normalizeSelect(int $rowNumber, array $column, string $raw): ?string
    {
        if ($column['key'] === 'gender') {
            $code = UserProfile::genderCode($raw);
            if ($code === null || $code === '') {
                $this->addError($rowNumber, $column['header'], 'Pilih Laki-laki atau Perempuan.');

                return $raw;
            }

            return $code;
        }

        foreach ($column['options'] as $option) {
            if (strcasecmp($option, $raw) === 0) {
                return $option;
            }
        }

        $this->addError($rowNumber, $column['header'], 'Pilih nilai dari daftar: ' . implode(', ', $column['options']) . '.');

        return $raw;
    }

    private function identifierExists(string $identifier): bool
    {
        return User::where(fn ($query) => $query->where('nomor_induk', $identifier)->orWhere('nim_nip', $identifier))->exists();
    }

    private function addError(int $row, string $column, string $message): void
    {
        $this->errors[] = ['row' => $row, 'column' => $column, 'message' => $message];
    }
}
