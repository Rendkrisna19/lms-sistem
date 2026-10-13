<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        @page { margin: 28px 30px 40px 30px; }
        body { font-family: "DejaVu Sans", sans-serif; font-size: 10px; color: #0f172a; }
        .title { font-size: 16px; font-weight: bold; margin: 0 0 4px 0; }
        .meta { font-size: 9.5px; color: #64748b; margin: 0 0 14px 0; }
        table { width: 100%; border-collapse: collapse; }
        thead th {
            background-color: #2563eb;
            color: #ffffff;
            font-weight: bold;
            text-align: left;
            padding: 7px 6px;
            font-size: 9.5px;
            border: 1px solid #2563eb;
        }
        tbody td {
            padding: 6px;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
        }
        tbody tr:nth-child(even) td { background-color: #f8fafc; }
        td.no, th.no { text-align: center; width: 30px; color: #64748b; }
        .footer { position: fixed; bottom: -26px; left: 0; right: 0; font-size: 8.5px; color: #94a3b8; }
        .empty { text-align: center; color: #64748b; padding: 18px; border: 1px solid #cbd5e1; }
    </style>
</head>
<body>
    <p class="title">{{ $title }}</p>
    <p class="meta">{{ $schoolName }} · {{ $total }} data · dicetak {{ $printedAt }}</p>

    <table>
        <thead>
            <tr>
                <th class="no">No</th>
                @foreach ($headers as $header)
                    <th>{{ $header }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $row)
                <tr>
                    <td class="no">{{ $row['no'] }}</td>
                    @foreach ($row['cells'] as $cell)
                        <td>{{ $cell }}</td>
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td class="empty" colspan="{{ count($headers) + 1 }}">Tidak ada data untuk diekspor.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">Cendekia · {{ $schoolName }}</div>
</body>
</html>
