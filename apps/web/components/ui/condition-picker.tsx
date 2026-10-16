import { BOOK_CONDITIONS, type BookCondition } from "@varaq/shared";
import { CONDITION_HINT, CONDITION_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function ConditionPicker({ value, onChange }: { value: BookCondition; onChange: (c: BookCondition) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="وضعیت فیزیکی کتاب">
      {BOOK_CONDITIONS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          onClick={() => onChange(c)}
          className={cn(
            "rounded-md border p-2.5 text-start transition",
            value === c ? "border-primary bg-primary/10" : "border-border bg-card",
          )}
        >
          <div className="text-sm font-bold">{CONDITION_LABEL[c]}</div>
          <div className="text-[11px] text-muted-foreground">{CONDITION_HINT[c]}</div>
        </button>
      ))}
    </div>
  );
}
