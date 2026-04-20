#!/usr/bin/env bash
# Scarica il logo principale da una lista di siti.
# Uso: ./download_logos.sh [lista.txt] [cartella_output]
#      default: siti.txt ./loghi
# Dipendenze: curl, grep, sed, awk (standard Unix)

set -uo pipefail

LIST="${1:-siti.txt}"
OUT="${2:-loghi}"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

mkdir -p "$OUT"

resolve_url() {
    local base_url="$1" ref="$2"
    case "$ref" in
        http://*|https://*) printf '%s' "$ref" ;;
        //*)                printf 'https:%s' "$ref" ;;
        /*)                 printf '%s%s' "$(sed -E 's#^(https?://[^/]+).*#\1#' <<<"$base_url")" "$ref" ;;
        *)                  printf '%s/%s' "${base_url%/}" "$ref" ;;
    esac
}

extract_attr() {
    # $1 = attr name, $2 = tag string
    grep -oiE "$1=(\"[^\"]+\"|'[^']+')" <<<"$2" \
        | head -1 \
        | sed -E "s/^$1=[\"']//; s/[\"']\$//"
}

find_logo() {
    local html="$1" page_url="$2"
    local flat; flat=$(tr -d '\n\r' <<<"$html")

    # 1) <img ... logo ... > preferendo uno dentro <header>/<nav>
    local header_block img src
    header_block=$(grep -oiE '<(header|nav)[^>]*>.*</(header|nav)>' <<<"$flat" | head -1)
    for scope in "$header_block" "$flat"; do
        [ -z "$scope" ] && continue
        img=$(grep -oiE '<img[^>]*logo[^>]*>' <<<"$scope" | head -1)
        [ -z "$img" ] && continue
        src=$(extract_attr "src" "$img")
        [ -z "$src" ] && src=$(extract_attr "data-src" "$img")
        [ -z "$src" ] && src=$(extract_attr "data-lazy-src" "$img")
        if [ -n "$src" ]; then
            resolve_url "$page_url" "$src"
            return 0
        fi
    done

    # 2) <link rel="...icon..." href="...">
    local link href
    link=$(grep -oiE "<link[^>]*rel=(\"[^\"]*icon[^\"]*\"|'[^']*icon[^']*')[^>]*>" <<<"$flat" | head -1)
    if [ -n "$link" ]; then
        href=$(extract_attr "href" "$link")
        if [ -n "$href" ]; then
            resolve_url "$page_url" "$href"
            return 0
        fi
    fi

    # 3) fallback /favicon.ico
    resolve_url "$page_url" "/favicon.ico"
}

detect_ext() {
    # $1 = Content-Type, $2 = URL
    local ct="$1" url="$2" ext
    case "$ct" in
        image/svg*)                            echo "svg"; return ;;
        image/png)                             echo "png"; return ;;
        image/jpeg)                            echo "jpg"; return ;;
        image/gif)                             echo "gif"; return ;;
        image/webp)                            echo "webp"; return ;;
        image/x-icon|image/vnd.microsoft.icon) echo "ico"; return ;;
    esac
    ext=$(sed -E 's#\?.*$##; s#.*\.##' <<<"$url" | tr '[:upper:]' '[:lower:]')
    case "$ext" in
        svg|png|jpg|jpeg|gif|webp|ico) echo "$ext" ;;
        *) echo "bin" ;;
    esac
}

while IFS= read -r site || [ -n "$site" ]; do
    site="$(echo "$site" | tr -d '[:space:]')"
    [ -z "$site" ] && continue
    case "$site" in '#'*) continue ;; esac
    case "$site" in http://*|https://*) ;; *) site="https://$site" ;; esac

    echo ">> $site"
    domain=$(sed -E 's#^https?://##; s#/.*##' <<<"$site")

    html=$(curl -sSL -A "$UA" --compressed "$site" 2>/dev/null) || true
    if [ -z "$html" ]; then
        echo "  [ERR] impossibile scaricare la pagina"
        continue
    fi

    logo_url=$(find_logo "$html" "$site")
    echo "  logo: $logo_url"

    tmp=$(mktemp)
    headers=$(mktemp)
    if ! curl -sSL -A "$UA" --compressed -D "$headers" -o "$tmp" "$logo_url" 2>/dev/null; then
        echo "  [ERR] download logo fallito"
        rm -f "$tmp" "$headers"
        continue
    fi

    ct=$(awk -F': ' 'tolower($1)=="content-type"{print tolower($2)}' "$headers" \
         | tail -1 | tr -d '\r' | cut -d';' -f1 | tr -d ' ')
    ext=$(detect_ext "$ct" "$logo_url")
    rm -f "$headers"

    out="$OUT/${domain}.${ext}"
    mv "$tmp" "$out"
    size=$(wc -c <"$out" | tr -d ' ')
    echo "  -> $out ($size byte)"
done < "$LIST"
