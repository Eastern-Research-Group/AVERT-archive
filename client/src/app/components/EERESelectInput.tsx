import type { ReactNode } from 'react';
// ---
import { Tooltip } from 'app/components/Tooltip';

export function EERESelectInput(props: {
  label?: string;
  ariaLabel: string;
  options: { id: string; name: string }[];
  value: string;
  fieldName: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  tooltip?: ReactNode;
}) {
  const {
    label,
    ariaLabel,
    options,
    value,
    fieldName,
    disabled,
    onChange,
    tooltip,
  } = props;

  return (
    <>
      {label && (
        <>
          <label htmlFor={fieldName} className="display-inline-block">
            {label}
          </label>
          <br />
        </>
      )}

      <div className="display-flex flex-align-center">
        <select
          id={fieldName}
          className={
            `usa-select ` +
            `display-inline-block height-auto ` +
            `margin-y-05 padding-left-1 padding-y-05 padding-right-4 ` +
            `border-width-1px border-solid border-base-light ` +
            `text-bold font-sans-xs`
          }
          aria-label={ariaLabel}
          value={value}
          data-avert-eere-input={fieldName}
          disabled={Boolean(disabled)}
          onChange={(ev) => onChange(ev.target.value)}
        >
          {options.map(({ id, name }) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>

        {tooltip && (
          <span className="margin-left-05">
            <Tooltip id={fieldName}>{tooltip}</Tooltip>
          </span>
        )}
      </div>
    </>
  );
}
