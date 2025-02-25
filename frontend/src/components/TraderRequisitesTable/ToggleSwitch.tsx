import { memo } from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  disabled: boolean;
  inactive?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, disabled, inactive }) => {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only peer"
      />
      <div
        className={`
          w-11 h-6 rounded-full transition-colors duration-200 
          ${inactive ? 'bg-gray-200' : (checked ? 'bg-blue-600' : 'bg-gray-300')}
          peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} 
          after:content-[""] after:absolute after:top-1 after:left-1 
          after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all 
          ${inactive ? 'after:translate-x-0' : (checked ? 'after:translate-x-5' : 'after:translate-x-0')}
        `}
      ></div>
    </label>
  );
};

export default memo(ToggleSwitch);