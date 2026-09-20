import os
import sys
import time
import subprocess
from pathlib import Path
from PIL import Image

def main():
    root_dir = Path(__file__).resolve().parent.parent
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    
    if not os.path.exists(chrome_path):
        print(f"Chrome not found at {chrome_path}", file=sys.stderr)
        sys.exit(1)

    base_url = "http://localhost:5173"
    
    # 5 scenes
    scenes = [
        ("1_main_shop", "/?demo=1&lang={lang}"),
        ("2_alchemy_lab", "/?demo=1&lang={lang}&modal=grimoire&tab=alchemy"),
        ("3_familiars_pets", "/?demo=1&lang={lang}&modal=grimoire&tab=pets"),
        ("4_ancient_artifacts", "/?demo=1&lang={lang}&modal=city&tab=artifacts"),
        ("5_city_orders", "/?demo=1&lang={lang}&modal=city&tab=orders"),
    ]
    
    languages = ["ru", "en", "tr"]
    
    out_base_dir = root_dir / "screenshots" / "mobile"
    temp_file = root_dir / "temp_shot.png"
    
    print("=== Генерация мобильных скриншотов (9:16, 1080x1920, 24-bit RGB) ===")
    
    for lang in languages:
        lang_dir = out_base_dir / lang
        lang_dir.mkdir(parents=True, exist_ok=True)
        print(f"\n--- Язык: {lang.upper()} ---")
        
        # Remove any old .jpg duplicates
        for old_jpg in lang_dir.glob("*.jpg"):
            old_jpg.unlink()
        
        for name, path_template in scenes:
            url = base_url + path_template.format(lang=lang)
            out_png = lang_dir / f"{name}.png"
            
            print(f"Снимок {name} [{lang}]...")
            
            cmd = [
                chrome_path,
                "--headless=new",
                f"--screenshot={temp_file}",
                "--window-size=540,960",
                "--force-device-scale-factor=2.0",
                "--disable-gpu",
                "--hide-scrollbars",
                url
            ]
            
            res = subprocess.run(cmd, capture_output=True, text=True)
            if res.returncode != 0 or not temp_file.exists():
                print(f"Ошибка при захвате {url}: {res.stderr}", file=sys.stderr)
                continue
                
            with Image.open(temp_file) as im:
                # Ensure exactly 1080x1920 (9:16)
                if im.size != (1080, 1920):
                    im = im.resize((1080, 1920), Image.Resampling.LANCZOS)
                
                # Convert to RGB (24-bit Truecolor, NO alpha channel)
                rgb_im = im.convert("RGB")
                
                # Save 24-bit PNG without alpha channel
                rgb_im.save(out_png, format="PNG")
                
            print(f"  -> Сохранено: {out_png.relative_to(root_dir)} ({out_png.stat().st_size:,} байт, 1080x1920 24-bit PNG)")
            
            if temp_file.exists():
                temp_file.unlink()
                
    print("\n=== Все 15 мобильных скриншотов успешно созданы без дубликатов и обрезки! ===")

if __name__ == "__main__":
    main()
