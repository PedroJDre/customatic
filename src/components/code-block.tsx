import { CopyButton } from "./copy-button";

export function CodeBlock({ code, label, copy, copied }: { code: string; label: string; copy: string; copied: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#262a4d] bg-[#151833]">
      <div className="flex items-center justify-between border-b border-white/10 py-1.5 pr-1.5 pl-4">
        <span className="text-[12.5px] font-medium text-white/60">{label}</span>
        <CopyButton text={code} label={copy} done={copied} />
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-[#e6e8ff]">
        <code>{code}</code>
      </pre>
    </div>
  );
}
