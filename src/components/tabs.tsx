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
    <div className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className="tab"
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
