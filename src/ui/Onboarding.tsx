import { useState } from 'react';
import { ArrowRight, Check, CloudOff, Layers, Sparkles } from 'lucide-react';
import { useStore } from '../store/store';
import { Modal } from './kit';
import { Logo } from './TopBar';

const STEP_ICONS = [Layers, CloudOff, Sparkles];

export function Onboarding() {
  const { state, t, update, navigate } = useStore();
  const [step, setStep] = useState(0);
  const open = !state.onboarded;

  if (!open) return null;

  const steps = [
    { title: t('onboard.step1.title'), desc: t('onboard.step1.desc') },
    { title: t('onboard.step2.title'), desc: t('onboard.step2.desc') },
    { title: t('onboard.step3.title'), desc: t('onboard.step3.desc') },
  ];

  const finish = () => {
    update((draft) => {
      draft.onboarded = true;
    });
    navigate('home');
  };

  const Icon = STEP_ICONS[step] ?? Layers;

  return (
    <Modal
      open={open}
      onClose={finish}
      hideClose
      width={520}
    >
      <div className="pt-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="font-[family-name:var(--font-head)] text-[14px] font-semibold">
              {t('app.name')}
            </span>
          </div>
          <button
            type="button"
            onClick={finish}
            className="text-[12px] text-[var(--muted)] hover:text-[var(--ink)]"
          >
            {t('onboard.skip')}
          </button>
        </div>

        <div
          className="grid place-items-center rounded-2xl border border-[var(--line)] py-10"
          style={{ background: 'var(--wash)' }}
        >
          <span
            className="grid h-16 w-16 place-items-center rounded-2xl"
            style={{
              background: 'var(--surface)',
              color: 'var(--accent)',
              boxShadow: 'var(--shadow-soft)',
            }}
          >
            <Icon size={30} strokeWidth={1.7} />
          </span>
        </div>

        <div className="mt-5 min-h-[92px]">
          <h2 className="font-[family-name:var(--font-head)] text-[22px] font-semibold tracking-[-0.02em]">
            {steps[step].title}
          </h2>
          <p className="mt-1.5 max-w-[42ch] text-[13.5px] leading-relaxed text-[var(--muted)]">
            {steps[step].desc}
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4">
          <div className="flex items-center gap-1.5">
            {steps.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setStep(index)}
                aria-label={item.title}
                aria-current={index === step}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: index === step ? 22 : 8,
                  background: index === step ? 'var(--accent)' : 'var(--line)',
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button type="button" className="btn btn-ghost h-9" onClick={() => setStep((prev) => prev - 1)}>
                {t('onboard.back')}
              </button>
            )}
            {step < steps.length - 1 ? (
              <button type="button" className="btn btn-primary h-9" onClick={() => setStep((prev) => prev + 1)}>
                {t('onboard.next')}
                <ArrowRight size={15} />
              </button>
            ) : (
              <button type="button" className="btn btn-primary h-9" onClick={finish}>
                <Check size={15} />
                {t('onboard.start')}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
