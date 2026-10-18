import asyncio
import edge_tts
import subprocess
import imageio_ffmpeg

def get_duration(path):
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    res = subprocess.run([ff, "-i", path], stderr=subprocess.PIPE, text=True)
    for line in res.stderr.splitlines():
        if "Duration" in line:
            parts = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = parts.split(":")
            return float(h) * 3600 + float(m) * 60 + float(s)
    return 0.0

async def main():
    segments = [
        ("seg1.mp3", "Donanım konusunu öğrencilerin deneyimleyebileceği bir laboratuvara dönüştürdüm!"),
        ("seg2.mp3", "İşlemci, RAM ve ekran kartı gibi donanımları 3 boyutlu inceleyebilir, özelliklerini öğrenebilirsin."),
        ("seg3.mp3", "Üstelik anakart montaj simülasyonuyla parçaları yerleştirebilir,"),
        ("seg4.mp3", "üç soruyla öğrendiklerini test edebilirsin."),
        ("seg5.mp3", "Donanım Laboratuvarı hazır! Sen de keşfet. Bağlantı profilde!")
    ]
    total = 0
    for fn, txt in segments:
        comm = edge_tts.Communicate(txt, "tr-TR-AhmetNeural", rate="+20%")
        await comm.save(fn)
        dur = get_duration(fn)
        print(f"{fn}: {dur:.2f}s | {txt}")
        total += dur
    print(f"Total speech duration: {total:.2f}s")

if __name__ == "__main__":
    asyncio.run(main())
