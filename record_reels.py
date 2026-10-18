import asyncio
import os
import subprocess
import time
from playwright.sync_api import sync_playwright
import imageio_ffmpeg

VOICEOVER_FILE = "voiceover_edge.mp3"

def get_audio_duration(file_path):
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    res = subprocess.run([ff, "-i", file_path], stderr=subprocess.PIPE, text=True)
    for line in res.stderr.splitlines():
        if "Duration" in line:
            parts = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = parts.split(":")
            return float(h) * 3600 + float(m) * 60 + float(s)
    return 22.42

def inject_overlay_helper(page):
    with open("overlay.js", "r", encoding="utf-8") as f:
        script = f.read()
    page.evaluate(script)

def update_overlay(page, badge, title, sub):
    page.evaluate(f"window.setReelsText({repr(badge)}, {repr(title)}, {repr(sub)})")

def show_final(page):
    page.evaluate("window.showFinalCard()")

def wait_until(target_t, t_start, page=None):
    now = time.time() - t_start
    rem = target_t - now
    if rem > 0:
        if page:
            page.wait_for_timeout(int(rem * 1000))
        else:
            time.sleep(rem)

def record_presentation():
    rec_dir = "temp_reels_rec"
    os.makedirs(rec_dir, exist_ok=True)
    
    with sync_playwright() as p:
        # Launch with maximum hardware acceleration for buttery smooth 60fps WebGL
        browser = p.chromium.launch(
            executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            headless=True,
            args=[
                "--enable-gpu",
                "--use-gl=angle",
                "--use-angle=d3d11",
                "--enable-features=VaapiVideoDecoder",
                "--ignore-gpu-blocklist",
                "--enable-gpu-rasterization",
                "--enable-zero-copy",
                "--disable-background-timer-throttling",
                "--disable-backgrounding-occluded-windows",
                "--disable-renderer-backgrounding",
                "--disable-features=CalculateNativeWinOcclusion",
            ]
        )
        ctx = browser.new_context(
            viewport={"width": 1080, "height": 1920},
            record_video_dir=rec_dir,
            record_video_size={"width": 1080, "height": 1920}
        )
        page = ctx.new_page()
        
        t_init = time.time()
        print("Pre-warming assets and models at http://localhost:3000 ...")
        page.goto("http://localhost:3000", wait_until="networkidle")
        page.wait_for_selector("canvas", timeout=10000)
        page.wait_for_timeout(2000)
        
        # Pre-cache models so switches are immediate and continuous
        try:
            print("Pre-caching models...")
            page.locator('button:has-text("RAM")').first.click()
            page.wait_for_timeout(1000)
            page.locator('button:has-text("Ekran Kartı")').first.click()
            page.wait_for_timeout(1000)
            page.locator('button:has-text("İşlemci")').first.click()
            page.wait_for_timeout(1200)
        except Exception as e:
            print("Precache warning:", e)
            
        inject_overlay_helper(page)
        page.wait_for_timeout(500)
        
        t_start_offset = time.time() - t_init
        t_start = time.time()
        print(f"=== PRESENTATION STARTS AT RECORDING OFFSET: {t_start_offset:.2f}s ===")
        
        # -------------------------------------------------------------
        # 0.0s - 3.6s: Hook & CPU 3D Model
        # Continuous automatic 360 rotation without stops
        # -------------------------------------------------------------
        print(f"[{time.time()-t_start:.2f}s] Hook: 3D İşlemci (Continuous Spin)")
        update_overlay(
            page,
            "🔥 3D BİLİŞİM LABORATUVARI",
            "Bilgisayar donanımlarını 3D incelemeye ne dersin?",
            "Öğrencilerin deneyimleyebileceği interaktif laboratuvar!"
        )
        wait_until(3.6, t_start, page)
        
        # -------------------------------------------------------------
        # 3.6s - 6.2s: Switch to RAM
        # -------------------------------------------------------------
        print(f"[{time.time()-t_start:.2f}s] Explore: RAM")
        update_overlay(
            page,
            "⚡ DONANIMLARI KEŞFET",
            "RAM ve Bellek Yuvalarını İncele",
            "Tüm parçaları 360° döndür ve yakından gör!"
        )
        try:
            page.locator('button:has-text("RAM")').first.click()
        except Exception as e:
            print("RAM click err:", e)
            
        wait_until(6.2, t_start, page)
        
        # -------------------------------------------------------------
        # 6.2s - 7.5s: Switch to Ekran Kartı (GPU)
        # -------------------------------------------------------------
        print(f"[{time.time()-t_start:.2f}s] Explore: Ekran Kartı (GPU)")
        update_overlay(
            page,
            "🎮 EKRAN KARTI (GPU)",
            "Tıkla ve Donanım Bilgilerini Aç!",
            "1 Cümlede Özet, Görevi ve Sınıf İçi Anlatım Notları"
        )
        try:
            page.locator('button:has-text("Ekran Kartı")').first.click()
        except Exception as e:
            print("GPU click err:", e)
            
        wait_until(7.5, t_start, page)
        
        # -------------------------------------------------------------
        # 7.5s - 9.8s: Bilgileri Aç
        # -------------------------------------------------------------
        print(f"[{time.time()-t_start:.2f}s] Open Bilgileri Aç panel")
        try:
            page.locator('button:has-text("Bilgileri Aç")').first.click()
        except Exception as e:
            print("Bilgileri ac click err:", e)
            
        wait_until(9.8, t_start, page)
        
        # -------------------------------------------------------------
        # 9.8s - 15.5s: Anakart Montaj Atölyesi
        # Sequential step-by-step assembly with orbiting camera
        # -------------------------------------------------------------
        print(f"[{time.time()-t_start:.2f}s] Simulation: Anakartı Tamamla!")
        update_overlay(
            page,
            "🛠️ EN ETKİLEYİCİ ÖZELLİK",
            "Anakart Montaj Atölyesi!",
            "İşlemci, RAM ve Ekran Kartını Doğru Yuvalara Tak!"
        )
        try:
            page.locator('button:has-text("Anakartı Tamamla!")').first.click()
        except Exception as e:
            print("Anakart click err:", e)
            
        wait_until(11.2, t_start, page)
        
        # Launch sequential animation where parts snap in rhythmically
        print(f"[{time.time()-t_start:.2f}s] Starting sequential assembly animation...")
        try:
            page.evaluate("""() => {
                const iframe = document.querySelector('iframe');
                if (iframe && iframe.contentWindow) {
                    if (iframe.contentWindow.playSequentialAssembly) {
                        iframe.contentWindow.playSequentialAssembly();
                    } else if (iframe.contentWindow.autoAssemble) {
                        iframe.contentWindow.autoAssemble();
                    }
                }
            }""")
        except Exception as e:
            print("Auto-assemble err:", e)
            
        wait_until(15.5, t_start, page)
        
        # -------------------------------------------------------------
        # 15.5s - 19.3s: Quiz Section
        # -------------------------------------------------------------
        print(f"[{time.time()-t_start:.2f}s] Quiz: Hazır Mısın?")
        try:
            # Back to lab
            page.evaluate("window.dispatchEvent(new MessageEvent('message', { data: 'back-to-lab' }))")
            page.wait_for_timeout(400)
            
            update_overlay(
                page,
                "🎯 ÖĞRENMEYİ KONTROL ET",
                "3 Soruyla Öğrendiklerini Test Et!",
                "Görsel ve kalıcı bilişim öğrenimi!"
            )
            # Open Quiz
            page.locator('button:has-text("Hazır Mısın?")').first.click()
        except Exception as e:
            print("Quiz open err:", e)
            
        wait_until(17.0, t_start, page)
        
        # Answer question 1 to show feedback & confetti
        print(f"[{time.time()-t_start:.2f}s] Answering Quiz question 1...")
        try:
            page.evaluate("""() => {
                const btns = document.querySelectorAll('.space-y-3 button');
                if (btns.length > 0) btns[0].click();
            }""")
        except Exception as e:
            print("Quiz answer err:", e)
            
        wait_until(18.2, t_start, page)
        
        # Progress to question 2 for continuous dynamic action
        print(f"[{time.time()-t_start:.2f}s] Advancing to next question...")
        try:
            page.locator('button:has-text("Sonraki Soru")').first.click()
        except Exception as e:
            print("Next question click err:", e)
            
        wait_until(19.3, t_start, page)
        
        # -------------------------------------------------------------
        # 19.3s - 22.8s: Fullscreen Closing Branding Card with Pulsing CTA
        # -------------------------------------------------------------
        print(f"[{time.time()-t_start:.2f}s] Final Closing Card")
        show_final(page)
        
        wait_until(22.8, t_start, page)
        
        ctx.close()
        browser.close()
        
    recorded_files = [os.path.join(rec_dir, f) for f in os.listdir(rec_dir) if f.endswith(".webm")]
    if not recorded_files:
        raise RuntimeError("No video file recorded!")
    latest_video = max(recorded_files, key=os.path.getmtime)
    return latest_video, t_start_offset

def export_final_video(raw_webm, audio_file, start_offset, output_mp4="Donanim_Laboratuvari_Tanitim.mp4"):
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    audio_dur = get_audio_duration(audio_file)
    print(f"Audio duration: {audio_dur:.2f}s | Trimming from offset {start_offset:.2f}s")
    
    # Render with constant 30 fps (CFR) and smooth motion interpolation
    cmd = [
        ff, "-y",
        "-ss", f"{start_offset:.2f}",
        "-i", raw_webm,
        "-i", audio_file,
        "-t", f"{audio_dur:.2f}",
        "-r", "30",
        "-vsync", "cfr",
        "-c:v", "libx264",
        "-preset", "slow",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        output_mp4
    ]
    print("Running ffmpeg render:", " ".join(cmd))
    subprocess.run(cmd, check=True)
    print(f"Render complete: {output_mp4}")

if __name__ == "__main__":
    if not os.path.exists(VOICEOVER_FILE):
        raise FileNotFoundError(f"{VOICEOVER_FILE} not found!")
    raw_video, start_offset = record_presentation()
    export_final_video(raw_video, VOICEOVER_FILE, start_offset, "Donanim_Laboratuvari_Tanitim.mp4")
    print("ALL COMPLETED SUCCESSFULLY!")
