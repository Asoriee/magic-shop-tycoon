import os
import sys
import zipfile
import subprocess
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def main():
    root_dir = Path(__file__).resolve().parent.parent
    dist_dir = root_dir / "dist"
    output_zip = root_dir / "magic-shop-tycoon-yandex.zip"

    print("=== Сборка проекта Vite ===")
    res = subprocess.run(["npm", "run", "build"], cwd=root_dir, shell=True)
    if res.returncode != 0:
        print("Ошибка при выполнении npm run build!", file=sys.stderr)
        sys.exit(1)

    if not dist_dir.exists():
        print(f"Директория {dist_dir} не найдена!", file=sys.stderr)
        sys.exit(1)

    index_html = dist_dir / "index.html"
    if not index_html.exists():
        print(f"Файл {index_html} не найден!", file=sys.stderr)
        sys.exit(1)

    # Проверка относительных путей в index.html
    html_content = index_html.read_text(encoding="utf-8")
    if 'src="/' in html_content or 'href="/' in html_content:
        print("ПРЕДУПРЕЖДЕНИЕ: В dist/index.html обнаружены абсолютные пути (/), они должны быть относительными (./)!", file=sys.stderr)

    print(f"\n=== Создание ZIP-архива для Яндекс Игр: {output_zip.name} ===")
    with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
        for file_path in sorted(dist_dir.rglob("*")):
            if file_path.is_file():
                arcname = file_path.relative_to(dist_dir).as_posix()
                zipf.write(file_path, arcname=arcname)

    # Проверка архива по требованиям Яндекс Игр
    print("\n=== Проверка архива на соответствие требованиям Яндекс Игр ===")
    index_html_count = 0
    total_uncompressed = 0
    with zipfile.ZipFile(output_zip, "r") as zipf:
        print("Содержимое архива:")
        for info in sorted(zipf.infolist(), key=lambda x: x.filename):
            print(f"  - {info.filename:<35} (несжатый: {info.file_size:,} байт, сжатый: {info.compress_size:,} байт)")
            total_uncompressed += info.file_size
            if info.filename.lower().endswith("index.html"):
                index_html_count += 1
                if info.filename != "index.html":
                    print(f"ОШИБКА: index.html должен находиться строго в корне архива, найден: {info.filename}", file=sys.stderr)
                    sys.exit(1)

    zip_size_bytes = output_zip.stat().st_size
    zip_size_mb = zip_size_bytes / (1024 * 1024)

    print(f"\nРазмер архива: {zip_size_bytes:,} байт ({zip_size_mb:.2f} МБ)")
    print(f"Количество файлов index.html: {index_html_count}")

    # Требования Яндекса:
    # 1. Не более одного index.html
    # 2. Весить не более 100 МБ
    if index_html_count != 1:
        print(f"ОШИБКА: В архиве должно быть ровно 1 файл index.html, найдено: {index_html_count}", file=sys.stderr)
        sys.exit(1)

    if zip_size_mb > 100:
        print(f"ОШИБКА: Архив превышает лимит в 100 МБ: {zip_size_mb:.2f} МБ", file=sys.stderr)
        sys.exit(1)

    print("\n[OK] Все требования Яндекс Игр выполнены!")
    print(f"[OK] Архив готов к загрузке в консоль: {output_zip}")

if __name__ == "__main__":
    main()
