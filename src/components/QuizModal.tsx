import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import type { HardwareItem } from '../types/hardware';
import { soundService } from '../services/sound';
import {
  X,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface Props {
  hardware: HardwareItem;
  onClose: () => void;
}

export const QuizModal: React.FC<Props> = ({
  hardware,
  onClose
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const questions = hardware.questions || [];
  const currentQ = questions[currentQuestionIndex];

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === currentQ.answer;
    if (isCorrect) {
      soundService.playCorrect();
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else {
      soundService.playIncorrect();
    }
  };

  const handleNext = () => {
    soundService.playClick();
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      soundService.playCelebration();
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.5 }
      });
    }
  };

  const handleRestart = () => {
    soundService.playClick();
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsFinished(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in select-none">
      <div className="w-full max-w-2xl flex flex-col rounded-3xl bg-lab-900 border border-sky-500/40 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-lab-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                Hazır Mısın? — {hardware.name}
              </h2>
              <p className="text-xs text-slate-400">
                Öğrendiklerini pekiştirmek için 3 soruluk mini test (Not verilmez).
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition min-h-[44px]"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-left">
          {questions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-base font-semibold">Bu parça için henüz test sorusu eklenmemiş.</p>
              <p className="text-xs text-slate-500 mt-1">Öğretmen panelinden yeni soru ekleyebilirsiniz.</p>
            </div>
          ) : !isFinished ? (
            <>
              {/* Question Progress & Text */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-sky-400 uppercase tracking-wider mb-2">
                  <span>Soru {currentQuestionIndex + 1} / {questions.length}</span>
                  <span className="text-slate-400">Pekiştirme Sorusu</span>
                </div>
                <h3 className="text-xl font-extrabold text-white leading-snug">
                  {currentQ.question}
                </h3>
              </div>

              {/* Options List */}
              <div className="space-y-3">
                {currentQ.options.map((option, idx) => {
                  const letter = String.fromCharCode(65 + idx); // A, B, C, D
                  const isSelected = selectedOption === idx;
                  const isCorrectAnswer = idx === currentQ.answer;

                  let buttonStyle = 'bg-lab-800/80 hover:bg-lab-700/80 border-slate-700 text-slate-200';

                  if (isAnswered) {
                    if (isCorrectAnswer) {
                      buttonStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/40';
                    } else if (isSelected) {
                      buttonStyle = 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/40';
                    } else {
                      buttonStyle = 'opacity-40 border-slate-800 text-slate-500';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 text-left font-semibold text-base min-h-[56px] active:scale-[0.99] ${buttonStyle}`}
                    >
                      <span className="w-9 h-9 rounded-xl flex items-center justify-center font-bold bg-slate-900/60 border border-slate-700/60 text-sky-400 flex-shrink-0">
                        {letter}
                      </span>
                      <span className="flex-1">{option}</span>
                      {isAnswered && isCorrectAnswer && (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                      )}
                      {isAnswered && isSelected && !isCorrectAnswer && (
                        <AlertCircle className="w-6 h-6 text-rose-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation & Feedback Card */}
              {isAnswered && (
                <div
                  className={`p-4 rounded-2xl border animate-fade-in ${
                    selectedOption === currentQ.answer
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                      : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm mb-1">
                    {selectedOption === currentQ.answer ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>Harika! Doğru Cevap</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-amber-400" />
                        <span>Tekrar Düşünelim...</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed opacity-90">
                    {currentQ.explanation}
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Finished Card */
            <div className="py-8 flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-sky-400 to-purple-500 flex items-center justify-center text-slate-950 shadow-neon">
                <Sparkles className="w-10 h-10 text-white animate-bounce" />
              </div>
              <h3 className="text-2xl font-black text-white">
                Tebrikler, Mini Testi Tamamladın!
              </h3>
              <p className="text-slate-300 text-sm max-w-md leading-relaxed">
                {hardware.name} donanımı hakkındaki soruları başarıyla inceledin.
                İstersen diğer parçaların sorularını da keşfedebilirsin.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-lab-950/80 flex items-center justify-between">
          {isFinished ? (
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lab-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition min-h-[48px]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Tekrar Çöz</span>
            </button>
          ) : (
            <div className="text-xs text-slate-400 font-medium">
              Not yok, sadece keşfet ve öğren! 🎯
            </div>
          )}

          {isAnswered && !isFinished ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition shadow-neon min-h-[48px]"
            >
              <span>{currentQuestionIndex + 1 === questions.length ? 'Testi Bitir' : 'Sonraki Soru'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                soundService.playClick();
                onClose();
              }}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition min-h-[48px]"
            >
              Kapat
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
