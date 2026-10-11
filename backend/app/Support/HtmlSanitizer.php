<?php

namespace App\Support;

use DOMDocument;
use DOMElement;
use DOMNode;

/**
 * Pembersih HTML berbasis allowlist untuk konten rich text (soal, opsi jawaban, pembahasan).
 * Tag di luar daftar akan dibuka (isinya dipertahankan), tag berbahaya dibuang beserta isinya,
 * dan atribut yang tidak dikenal / URL dengan skema berbahaya dihapus.
 */
class HtmlSanitizer
{
    /** Tag yang diizinkan beserta atributnya. */
    private const ALLOWED = [
        'p' => ['style'],
        'br' => [],
        'strong' => [],
        'b' => [],
        'em' => [],
        'i' => [],
        'u' => [],
        's' => [],
        'sub' => [],
        'sup' => [],
        'mark' => [],
        'code' => [],
        'pre' => [],
        'blockquote' => [],
        'ul' => [],
        'ol' => ['start'],
        'li' => [],
        'h2' => ['style'],
        'h3' => ['style'],
        'h4' => ['style'],
        'span' => [],
        'hr' => [],
        'a' => ['href', 'target', 'rel'],
        'img' => ['src', 'alt', 'title', 'width', 'height'],
        'table' => [],
        'thead' => [],
        'tbody' => [],
        'tr' => [],
        'th' => ['colspan', 'rowspan'],
        'td' => ['colspan', 'rowspan'],
    ];

    /** Tag yang dibuang seluruhnya beserta isinya. */
    private const DROP_WITH_CONTENT = [
        'script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet',
        'form', 'input', 'button', 'select', 'textarea', 'option', 'svg', 'math',
        'template', 'noscript', 'link', 'meta', 'base', 'title', 'head', 'audio', 'video',
    ];

    public function clean(?string $html): string
    {
        if ($html === null || trim($html) === '') {
            return '';
        }

        $dom = new DOMDocument('1.0', 'UTF-8');
        $previous = libxml_use_internal_errors(true);
        $dom->loadHTML(
            '<?xml encoding="utf-8"?><div id="__sanitizer_root">' . $html . '</div>',
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD | LIBXML_NONET
        );
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $root = $dom->getElementById('__sanitizer_root');
        if (!$root) {
            return e(strip_tags($html));
        }

        $this->sanitizeChildren($root);

        $output = '';
        foreach ($root->childNodes as $child) {
            $output .= $dom->saveHTML($child);
        }

        return trim($output);
    }

    /** True jika konten tidak memiliki teks maupun gambar. */
    public function isBlank(?string $html): bool
    {
        if ($html === null) {
            return true;
        }
        if (stripos($html, '<img') !== false) {
            return false;
        }
        $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        return trim(str_replace("\u{00A0}", ' ', $text)) === '';
    }

    private function sanitizeChildren(DOMNode $node): void
    {
        // Salin dulu karena daftar child berubah saat dimodifikasi
        $children = iterator_to_array($node->childNodes);

        foreach ($children as $child) {
            if ($child->nodeType === XML_TEXT_NODE || $child->nodeType === XML_CDATA_SECTION_NODE) {
                continue;
            }

            if (!$child instanceof DOMElement) {
                // Komentar, processing instruction, dsb.
                $node->removeChild($child);
                continue;
            }

            $tag = strtolower($child->tagName);

            if (in_array($tag, self::DROP_WITH_CONTENT, true)) {
                $node->removeChild($child);
                continue;
            }

            if (!array_key_exists($tag, self::ALLOWED)) {
                // Buka tag: pindahkan isinya ke parent lalu bersihkan isinya juga
                $this->sanitizeChildren($child);
                while ($child->firstChild) {
                    $node->insertBefore($child->firstChild, $child);
                }
                $node->removeChild($child);
                continue;
            }

            $this->sanitizeAttributes($child, self::ALLOWED[$tag]);

            if ($tag === 'img' && !$child->hasAttribute('src')) {
                $node->removeChild($child);
                continue;
            }

            $this->sanitizeChildren($child);
        }
    }

    private function sanitizeAttributes(DOMElement $element, array $allowed): void
    {
        $tag = strtolower($element->tagName);

        foreach (iterator_to_array($element->attributes) as $attribute) {
            $name = strtolower($attribute->name);
            $value = trim($attribute->value);

            if (!in_array($name, $allowed, true)) {
                $element->removeAttribute($attribute->name);
                continue;
            }

            $keep = match ($name) {
                'href', 'src' => $this->isSafeUrl($value),
                'style' => ($value = $this->sanitizeStyle($value)) !== '',
                'width', 'height', 'colspan', 'rowspan', 'start' => ctype_digit($value) && (int) $value <= 4000,
                'target' => in_array($value, ['_blank', '_self'], true),
                default => true,
            };

            if ($keep) {
                $element->setAttribute($attribute->name, $value);
            } else {
                $element->removeAttribute($attribute->name);
            }
        }

        if ($tag === 'a' && $element->getAttribute('target') === '_blank') {
            $element->setAttribute('rel', 'noopener noreferrer nofollow');
        }
    }

    /** Hanya http(s), mailto, atau path relatif ke server ini. */
    private function isSafeUrl(string $url): bool
    {
        if ($url === '') {
            return false;
        }
        // Buang karakter kontrol & spasi yang bisa dipakai menyamarkan skema (mis. "java\tscript:")
        $normalized = strtolower(preg_replace('/[\x00-\x20]+/', '', $url));

        if (str_starts_with($normalized, '/') && !str_starts_with($normalized, '//')) {
            return true;
        }

        return (bool) preg_match('#^(https?:|mailto:)#', $normalized);
    }

    /** Hanya properti text-align yang dipertahankan. */
    private function sanitizeStyle(string $style): string
    {
        if (preg_match('/text-align\s*:\s*(left|right|center|justify)/i', $style, $match)) {
            return 'text-align: ' . strtolower($match[1]);
        }
        return '';
    }
}
