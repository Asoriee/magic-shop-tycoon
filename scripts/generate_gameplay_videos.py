import os
import sys
import wave
import subprocess
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

# Audio synthesizer for magical ambient fantasy soundtrack
def generate_fantasy_audio(duration_sec: float, sample_rate: int = 44100) -> bytes:
    total_samples = int(duration_sec * sample_rate)
    t = np.linspace(0, duration_sec, total_samples, endpoint=False)
    audio = np.zeros(total_samples, dtype=np.float32)

    # Note frequencies (Pentatonic fantasy scale: A3, C4, D4, E4, G4, A4, C5, D5, E5, G5, A5)
    scale = [220.0, 261.63, 293.66, 329.63, 392.00, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0]

    # Melody pattern across 21 seconds (tempo ~108 bpm, 0.55s per beat)
    beat = 0.55
    melody_notes = [
        # Phrase 1: Welcome to the shop
        (0.0 * beat, 5, 2.0), (1.0 * beat, 7, 1.8), (2.0 * beat, 8, 2.2), (3.0 * beat, 10, 3.0),
        (4.0 * beat, 7, 2.0), (5.0 * beat, 8, 2.0), (6.0 * beat, 5, 2.5), (7.0 * beat, 3, 3.0),
        # Phrase 2: Alchemy magic
        (8.0 * beat, 4, 1.8), (9.0 * beat, 6, 1.8), (10.0 * beat, 7, 2.2), (11.0 * beat, 9, 3.0),
        (12.0 * beat, 8, 2.0), (13.0 * beat, 7, 1.8), (14.0 * beat, 5, 2.5), (15.0 * beat, 4, 3.0),
        # Phrase 3: Familiars & Relics
        (16.0 * beat, 3, 2.0), (17.0 * beat, 5, 1.8), (18.0 * beat, 7, 2.0), (19.0 * beat, 8, 2.5),
        (20.0 * beat, 10, 3.0), (21.0 * beat, 9, 2.0), (22.0 * beat, 7, 2.2), (23.0 * beat, 5, 3.0),
        # Phrase 4: Grand finale
        (24.0 * beat, 6, 2.0), (25.0 * beat, 7, 2.0), (26.0 * beat, 8, 2.5), (27.0 * beat, 10, 3.5),
        (29.0 * beat, 10, 4.0), (31.0 * beat, 8, 4.5), (33.0 * beat, 5, 5.0)
    ]

    for start_t, note_idx, dur in melody_notes:
        if start_t >= duration_sec:
            continue
        freq = scale[note_idx % len(scale)]
        start_sample = int(start_t * sample_rate)
        note_samples = min(int(dur * sample_rate), total_samples - start_sample)
        if note_samples <= 0:
            continue
        
        t_note = np.linspace(0, dur, note_samples, endpoint=False)
        # Bell / music box harmonic envelope
        env = np.exp(-2.2 * t_note)
        # Fundamental + harmonics
        tone = (
            1.0 * np.sin(2 * np.pi * freq * t_note) +
            0.45 * np.sin(2 * np.pi * (freq * 2) * t_note) * np.exp(-3.5 * t_note) +
            0.25 * np.sin(2 * np.pi * (freq * 3) * t_note) * np.exp(-5.0 * t_note) +
            0.15 * np.sin(2 * np.pi * (freq * 4.2) * t_note) * np.exp(-7.0 * t_note)
        ) * env
        audio[start_sample:start_sample + note_samples] += tone * 0.35

    # Gentle ambient warm background chord pad (A minor / C major warmth)
    pad_freqs = [110.0, 164.81, 220.0, 261.63, 329.63]
    for pf in pad_freqs:
        # Subtle slow LFO vibrato
        lfo = 1.0 + 0.005 * np.sin(2 * np.pi * 0.4 * t)
        pad = np.sin(2 * np.pi * (pf * lfo) * t) * 0.08
        audio += pad

    # Chime sparkle on scene transitions (every ~4.0 seconds: 4.0, 8.0, 12.0, 16.0)
    for chime_t in [4.0, 8.0, 12.0, 16.0]:
        for i, c_f in enumerate([880.0, 1174.66, 1318.51, 1567.98, 1760.0]):
            c_start = chime_t + i * 0.07
            if c_start >= duration_sec:
                continue
            s_idx = int(c_start * sample_rate)
            c_dur = 1.2
            c_samples = min(int(c_dur * sample_rate), total_samples - s_idx)
            if c_samples <= 0:
                continue
            tn = np.linspace(0, c_dur, c_samples, endpoint=False)
            chime = np.sin(2 * np.pi * c_f * tn) * np.exp(-4.5 * tn) * 0.15
            audio[s_idx:s_idx + c_samples] += chime

    # Master smooth fade in and fade out
    fade_in_samples = int(0.5 * sample_rate)
    fade_out_samples = int(1.5 * sample_rate)
    audio[:fade_in_samples] *= np.linspace(0, 1, fade_in_samples)
    audio[-fade_out_samples:] *= np.linspace(1, 0, fade_out_samples)

    # Master normalization
    max_val = np.max(np.abs(audio))
    if max_val > 0:
        audio = (audio / max_val) * 0.85

    # Convert to 16-bit stereo PCM
    audio_int16 = (audio * 32767).astype(np.int16)
    stereo = np.column_stack((audio_int16, audio_int16))
    return stereo.tobytes()

def draw_pill_banner(
    frame: Image.Image,
    title: str,
    subtitle: str,
    font_title: ImageFont.FreeTypeFont,
    font_sub: ImageFont.FreeTypeFont,
    opacity: float = 1.0
):
    """Draws a premium glassmorphic title ribbon at the top center of the frame."""
    if opacity <= 0.01:
        return

    w, h = frame.size
    
    # Calculate text sizes
    tb_title = font_title.getbbox(title)
    tw_title = tb_title[2] - tb_title[0]
    th_title = tb_title[3] - tb_title[1]

    tb_sub = font_sub.getbbox(subtitle)
    tw_sub = tb_sub[2] - tb_sub[0]
    th_sub = tb_sub[3] - tb_sub[1]

    content_w = max(tw_title, tw_sub) + 120
    banner_w = min(1760, max(1100, content_w))
    banner_h = 130
    
    bx0 = (w - banner_w) // 2
    by0 = 42
    bx1 = bx0 + banner_w
    by1 = by0 + banner_h

    # Create RGBA overlay for smooth alpha blending
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)

    # Outer glow
    glow_alpha = int(40 * opacity)
    for g in range(8, 0, -2):
        odraw.rounded_rectangle(
            [bx0 - g, by0 - g, bx1 + g, by1 + g],
            radius=24 + g,
            outline=(241, 196, 15, int(glow_alpha * (1 - g / 10))),
            width=2
        )

    # Dark mystical glassmorphic background
    bg_alpha = int(235 * opacity)
    odraw.rounded_rectangle(
        [bx0, by0, bx1, by1],
        radius=24,
        fill=(18, 12, 36, bg_alpha),
        outline=(241, 196, 15, int(200 * opacity)),
        width=2
    )

    # Accent star badge icon on the left
    icon_cx = bx0 + 52
    icon_cy = by0 + banner_h // 2
    odraw.ellipse(
        [icon_cx - 24, icon_cy - 24, icon_cx + 24, icon_cy + 24],
        fill=(241, 196, 15, int(45 * opacity)),
        outline=(255, 215, 0, int(180 * opacity)),
        width=2
    )
    # 4-point star polygon
    star_pts = [
        (icon_cx, icon_cy - 16),
        (icon_cx + 5, icon_cy - 5),
        (icon_cx + 16, icon_cy),
        (icon_cx + 5, icon_cy + 5),
        (icon_cx, icon_cy + 16),
        (icon_cx - 5, icon_cy + 5),
        (icon_cx - 16, icon_cy),
        (icon_cx - 5, icon_cy - 5)
    ]
    odraw.polygon(star_pts, fill=(255, 215, 0, int(240 * opacity)))

    # Text rendering with subtle shadow
    text_x = bx0 + 96
    title_y = by0 + 20
    sub_y = by0 + 72

    shadow_alpha = int(180 * opacity)
    text_alpha = int(255 * opacity)

    # Shadow
    odraw.text((text_x + 2, title_y + 2), title, font=font_title, fill=(0, 0, 0, shadow_alpha))
    odraw.text((text_x + 1, sub_y + 1), subtitle, font=font_sub, fill=(0, 0, 0, shadow_alpha))

    # Main text
    odraw.text((text_x, title_y), title, font=font_title, fill=(255, 215, 0, text_alpha))
    odraw.text((text_x, sub_y), subtitle, font=font_sub, fill=(224, 219, 255, text_alpha))

    # Composite overlay over frame
    frame.paste(Image.alpha_composite(frame.convert("RGBA"), overlay).convert("RGB"))

def get_scene_frame(img: Image.Image, progress: float, center_norm=(0.5, 0.5), zoom_range=(1.00, 1.05)) -> Image.Image:
    """Computes a smooth Ken Burns camera zoom and crop for a 1920x1080 image."""
    w, h = img.size
    z0, z1 = zoom_range
    scale = z0 + (z1 - z0) * progress
    
    crop_w = w / scale
    crop_h = h / scale
    
    cx, cy = center_norm[0] * w, center_norm[1] * h
    
    x0 = max(0, min(w - crop_w, cx - crop_w / 2))
    y0 = max(0, min(h - crop_h, cy - crop_h / 2))
    x1 = x0 + crop_w
    y1 = y0 + crop_h
    
    cropped = img.crop((int(x0), int(y0), int(x1), int(y1)))
    return cropped.resize((w, h), Image.Resampling.BILINEAR)

def build_gameplay_video(lang: str, output_file: Path, ffmpeg_path: str):
    root_dir = Path(__file__).resolve().parent.parent
    screenshots_dir = root_dir / "screenshots" / lang
    
    scenes_meta = {
        "ru": [
            ("1_main_shop.png", "МАГИЧЕСКИЙ МАГАЗИН: СТАНЬТЕ ВЕЛИКИМ АРХИМАГОМ!", "Кликайте по котлу, собирайте золото и развивайте производство", (0.5, 0.55), (1.00, 1.05)),
            ("2_alchemy_lab.png", "ТАЙНАЯ АЛХИМИЯ: ВАРИТЕ РЕДКИЕ ЭЛИКСИРЫ", "Комбинируйте травы и минералы, открывайте тайные рецепты", (0.35, 0.5), (1.02, 1.06)),
            ("3_familiars_pets.png", "МАГИЧЕСКИЕ ФАМИЛЬЯРЫ И ЭКСПЕДИЦИИ", "Приручайте питомцев, отправляйте в походы за сокровищами", (0.5, 0.45), (1.00, 1.05)),
            ("4_ancient_artifacts.png", "ДРЕВНИЕ РЕЛИКВИИ И СИЛА ЗВЁЗДНОЙ ПЫЛИ", "Собирайте коллекции артефактов и получайте вечные множители дохода", (0.5, 0.5), (1.05, 1.00)),
            ("5_city_orders.png", "КОРОЛЕВСКИЕ ЗАКАЗЫ И ГИЛЬДИЯ МАГОВ", "Выполняйте контракты архимагов и открывайте ларцы с наградами", (0.4, 0.5), (1.00, 1.05)),
        ],
        "en": [
            ("1_main_shop.png", "MAGIC SHOP TYCOON: BECOME AN ARCHMAGE!", "Tap the mystical cauldron, collect gold and upgrade production", (0.5, 0.55), (1.00, 1.05)),
            ("2_alchemy_lab.png", "SECRET ALCHEMY: CRAFT RARE ELIXIRS", "Combine herbs and reagents, discover legendary brewing formulas", (0.35, 0.5), (1.02, 1.06)),
            ("3_familiars_pets.png", "MYSTICAL FAMILIARS & EXPEDITIONS", "Bond with companions and send them on quests for rare loot", (0.5, 0.45), (1.00, 1.05)),
            ("4_ancient_artifacts.png", "ANCIENT RELICS & STARDUST POWER", "Collect artifact sets and unlock permanent astral income multipliers", (0.5, 0.5), (1.05, 1.00)),
            ("5_city_orders.png", "ROYAL ORDERS & MAGE GUILD CONTRACTS", "Fulfill high-tier contracts for archmages and earn treasure chests", (0.4, 0.5), (1.00, 1.05)),
        ],
        "tr": [
            ("1_main_shop.png", "BÜYÜ DÜKKÂNI: BAŞBÜYÜCÜ OLUN!", "Kazana tıklayın, altın toplayın ve üretimi geliştirin", (0.5, 0.55), (1.00, 1.05)),
            ("2_alchemy_lab.png", "GİZLİ SİMYA: NADİR İKSİRLER ÜRETİN", "Otları ve cevherleri birleştirin, efsanevi tarifleri keşfedin", (0.35, 0.5), (1.02, 1.06)),
            ("3_familiars_pets.png", "BÜYÜLÜ YOLDAŞLAR VE SEFERLER", "Evcil hayvanlar edinin ve onları nadir ganimet seferlerine gönderin", (0.5, 0.45), (1.00, 1.05)),
            ("4_ancient_artifacts.png", "KADİM ESERLER VE YILDIZ TOZU GÜCÜ", "Kalıntı setlerini toplayın ve kalıcı büyü çarpanlarını açın", (0.5, 0.5), (1.05, 1.00)),
            ("5_city_orders.png", "KRALİYET SİPARİŞLERİ VE BÜYÜCÜ LONCASI", "Başbüyücü sözleşmelerini tamamlayın ve hazine sandıkları kazanın", (0.4, 0.5), (1.00, 1.05)),
        ]
    }

    scenes_data = scenes_meta[lang]
    loaded_images = []
    for fname, title, sub, center, zrange in scenes_data:
        p = screenshots_dir / fname
        if not p.exists():
            raise FileNotFoundError(f"Missing screenshot: {p}")
        loaded_images.append(Image.open(p).convert("RGB"))

    width, height = 1920, 1080
    fps = 30
    scene_dur = 4.6
    transition_dur = 0.6
    
    frames_per_scene = int(scene_dur * fps)          # 138 frames
    frames_trans = int(transition_dur * fps)          # 18 frames
    frames_hold = frames_per_scene - frames_trans     # 120 frames
    
    total_frames = len(scenes_data) * frames_hold + frames_trans
    total_sec = total_frames / fps                     # ~21.2 sec (under 28s limit)

    print(f"\n[{lang.upper()}] Создание видео: {total_frames} кадров ({total_sec:.1f} сек, {width}x{height} @ {fps}fps)")

    # Generate soundtrack
    temp_wav = root_dir / f"temp_audio_{lang}.wav"
    audio_pcm = generate_fantasy_audio(total_sec, 44100)
    with wave.open(str(temp_wav), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(44100)
        wf.writeframes(audio_pcm)

    # Fonts
    font_path_bold = r"C:\Windows\Fonts\segoeuib.ttf"
    font_path_regular = r"C:\Windows\Fonts\segoeui.ttf"
    font_title = ImageFont.truetype(font_path_bold, 33)
    font_sub = ImageFont.truetype(font_path_regular, 22)

    # Start ffmpeg
    cmd = [
        ffmpeg_path,
        "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{width}x{height}",
        "-pix_fmt", "rgb24",
        "-r", str(fps),
        "-i", "-",
        "-i", str(temp_wav),
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        str(output_file)
    ]

    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)

    num_scenes = len(scenes_data)
    current_global_frame = 0

    for s_idx in range(num_scenes):
        fname, title, sub, center, zrange = scenes_data[s_idx]
        cur_img = loaded_images[s_idx]
        
        has_next = (s_idx < num_scenes - 1)
        next_img = loaded_images[s_idx + 1] if has_next else None
        next_center = scenes_data[s_idx + 1][3] if has_next else (0.5, 0.5)
        next_zrange = scenes_data[s_idx + 1][4] if has_next else (1.0, 1.0)
        
        # Frames for this scene:
        # If it's the last scene, we render all frames_per_scene
        # Otherwise we render frames_hold (solo) + frames_trans (crossfade)
        total_scene_frames = frames_per_scene if not has_next else (frames_hold + frames_trans)

        for f_in_scene in range(total_scene_frames):
            prog = f_in_scene / float(frames_per_scene)
            base_frame = get_scene_frame(cur_img, prog, center, zrange)

            # Check if in crossfade to next scene
            if has_next and f_in_scene >= frames_hold:
                t_fade = (f_in_scene - frames_hold) / float(frames_trans)
                next_prog = (f_in_scene - frames_hold) / float(frames_per_scene)
                next_frame = get_scene_frame(next_img, next_prog, next_center, next_zrange)
                # Linear blend
                base_frame = Image.blend(base_frame, next_frame, t_fade)

            # Banner opacity: fade in first 10 frames of scene, fade out during crossfade
            banner_opacity = 1.0
            if f_in_scene < 10:
                banner_opacity = f_in_scene / 10.0
            elif has_next and f_in_scene >= frames_hold:
                banner_opacity = 1.0 - (f_in_scene - frames_hold) / float(frames_trans)

            draw_pill_banner(base_frame, title, sub, font_title, font_sub, banner_opacity)
            proc.stdin.write(base_frame.tobytes())
            current_global_frame += 1

    proc.stdin.close()
    stderr = proc.stderr.read()
    proc.wait()

    if temp_wav.exists():
        temp_wav.unlink()

    if proc.returncode != 0:
        print(f"Ошибка ffmpeg: {stderr.decode('utf-8', errors='ignore')}", file=sys.stderr)
        raise RuntimeError("FFmpeg encoding failed")

    file_size_mb = output_file.stat().st_size / (1024 * 1024)
    print(f"[{lang.upper()}] Готово! Файл: {output_file.name} | Размер: {file_size_mb:.2f} МБ | Длительность: {total_sec:.1f} с")

def main():
    root_dir = Path(__file__).resolve().parent.parent
    videos_dir = root_dir / "videos"
    videos_dir.mkdir(parents=True, exist_ok=True)

    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

    for lang in ["ru", "en", "tr"]:
        out_mp4 = videos_dir / f"gameplay_{lang}.mp4"
        build_gameplay_video(lang, out_mp4, ffmpeg_exe)

    print("\n=== Все 3 видео геймплея успешно созданы! ===")

if __name__ == "__main__":
    main()
