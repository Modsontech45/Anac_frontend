import type { ReactNode } from 'react';

export interface RibbonTab {
  id: string;
  label: string;
  content: ReactNode;
}

export interface RibbonProps {
  tabs: RibbonTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const Ribbon = ({ tabs, activeTab, onTabChange }: RibbonProps) => {
  const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className="bg-windows-surface border-b border-windows-border">
      {/* Tab Headers */}
      <div className="flex items-center border-b border-windows-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors relative
              ${
                activeTab === tab.id
                  ? 'text-windows-accent'
                  : 'text-windows-textSecondary hover:text-windows-text'
              }
            `}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-windows-accent" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-4 py-2">{activeContent}</div>
    </div>
  );
};

export interface RibbonGroupProps {
  title?: string;
  children: ReactNode;
}

export const RibbonGroup = ({ title, children }: RibbonGroupProps) => {
  return (
    <div className="flex flex-col items-center px-3 border-r border-windows-border last:border-r-0">
      <div className="flex items-center gap-1 py-1">{children}</div>
      {title && (
        <span className="text-xs text-windows-textSecondary mt-1">{title}</span>
      )}
    </div>
  );
};

export interface RibbonButtonProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'lg';
}

export const RibbonButton = ({
  icon,
  label,
  onClick,
  disabled = false,
  size = 'sm',
}: RibbonButtonProps) => {
  if (size === 'lg') {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`flex flex-col items-center justify-center p-2 rounded-windows transition-colors
          ${
            disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-gray-100 active:bg-gray-200'
          }
        `}
      >
        <div className="text-windows-accent">{icon}</div>
        <span className="text-xs text-windows-text mt-1">{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-windows text-sm transition-colors
        ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-gray-100 active:bg-gray-200'
        }
      `}
    >
      <span className="text-windows-accent">{icon}</span>
      <span className="text-windows-text">{label}</span>
    </button>
  );
};

export default Ribbon;
