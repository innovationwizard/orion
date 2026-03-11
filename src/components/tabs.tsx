type TabOption = {
  id: string;
  label: string;
};

type TabsProps = {
  tabs: TabOption[];
  value: string;
  onChange: (value: string) => void;
};

export default function Tabs({ tabs, value, onChange }: TabsProps) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className="border border-border bg-card px-4 py-2 rounded-full cursor-pointer font-medium text-sm text-muted transition-colors hover:text-text-primary hover:border-muted aria-selected:border-primary aria-selected:text-primary aria-selected:bg-primary/[0.08] aria-selected:font-semibold"
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
