/** @jsxImportSource @emotion/react */

import { css } from '@emotion/react';

const selectStyles = css`
  margin: 0.25rem;
  padding: 0.125rem 0.25rem;
  border: 1px solid #ccc;

  &:disabled {
    background-color: #f0f0f0; // base-lightest
  }
`;

type Props = {
  ariaLabel: string;
  options: { id: string; name: string }[];
  value: string;
  fieldName: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function EERESelectInput({
  ariaLabel,
  options,
  value,
  fieldName,
  disabled,
  onChange,
}: Props) {
  return (
    <>
      <select
        id={fieldName}
        css={selectStyles}
        aria-label={ariaLabel}
        value={value}
        data-avert-eere-input={fieldName}
        disabled={disabled ? true : false}
        onChange={(ev) => onChange(ev.target.value)}
      >
        {options.map(({ id, name }) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </>
  );
}
