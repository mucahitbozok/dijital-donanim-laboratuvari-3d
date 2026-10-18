import asyncio
import edge_tts

text = (
    "Donanım konusunu öğrencilerin deneyimleyebileceği bir laboratuvara dönüştürdüm! "
    "İşlemci, RAM ve ekran kartı gibi donanımları 3 boyutlu inceleyebilir, özelliklerini öğrenebilirsin. "
    "Üstelik anakart montaj simülasyonuyla parçaları yerleştirebilir, "
    "üç soruyla öğrendiklerini test edebilirsin. "
    "Donanım Laboratuvarı hazır! Sen de keşfet. Bağlantı profilde!"
)

async def main():
    comm = edge_tts.Communicate(text, 'tr-TR-AhmetNeural', rate='+24%')
    async for chunk in comm.stream():
        if chunk['type'] == 'WordBoundary':
            sec = chunk['offset'] / 10_000_000
            print(f"{sec:.2f}s: {chunk['text']}")

asyncio.run(main())
