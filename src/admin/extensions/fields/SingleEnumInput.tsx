/**
 * SingleEnumInput - custom Strapi v5 field input (single choice, stored as string).
 *
 * Why not a plain `enumeration`? Strapi normalises enum values to alphanumerics
 * (GraphQL / TS-union safety), so "Southeast Asia" or "North Africa & Egypt"
 * would collide or empty out. The FE renders `project.region` verbatim
 * (mapProject does `region: text(project.region)`), so the stored value has to
 * stay the exact human-readable string. A string-backed custom field gives the
 * dropdown without touching the wire format.
 *
 * Choices come from `options.choices` on the attribute: comma-separated,
 * optional `value=Label`. Same syntax as MultiEnumInput.
 */
import * as React from 'react';
import { forwardRef, useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Field, SingleSelect, SingleSelectOption, Box, Typography } from '@strapi/design-system';

type Choice = { value: string; label: string };

const parseChoices = (raw: string | undefined): Choice[] => {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const eqIdx = entry.indexOf('=');
      if (eqIdx === -1) return { value: entry, label: entry };
      return { value: entry.slice(0, eqIdx).trim(), label: entry.slice(eqIdx + 1).trim() };
    });
};

export const SingleEnumInput = forwardRef<HTMLDivElement>((props, _ref) => {
  const { attribute, value, onChange, name, intlLabel, description, error, disabled, required } =
    props as any;
  const { formatMessage } = useIntl();
  const label = intlLabel ? formatMessage(intlLabel) : name;
  const hint = description;
  const choices = useMemo(
    () => parseChoices(attribute?.options?.choices),
    [attribute?.options?.choices]
  );
  const current = typeof value === 'string' ? value : '';

  const handleChange = useCallback(
    (next: string | number) => {
      onChange({ target: { name, type: 'string', value: next === '' ? null : String(next) } });
    },
    [name, onChange]
  );

  if (!choices.length) {
    return (
      <Field.Root error={error} hint={hint} required={required}>
        <Field.Label>{label}</Field.Label>
        <Box paddingTop={2} paddingBottom={2}>
          <Typography textColor="neutral500" variant="pi">
            No choices defined. Set options.choices on the field (e.g. Southeast Asia,East Asia).
          </Typography>
        </Box>
        <Field.Hint />
        <Field.Error />
      </Field.Root>
    );
  }

  return (
    <Field.Root error={error} hint={hint} required={required} name={name}>
      <Field.Label>{label}</Field.Label>
      <SingleSelect
        value={current}
        onChange={handleChange}
        disabled={disabled}
        // Lets an editor undo a pick without reloading the form.
        onClear={() => handleChange('')}
      >
        {choices.map((choice) => (
          <SingleSelectOption key={choice.value} value={choice.value}>
            {choice.label}
          </SingleSelectOption>
        ))}
      </SingleSelect>
      <Field.Hint />
      <Field.Error />
    </Field.Root>
  );
});

SingleEnumInput.displayName = 'SingleEnumInput';
export default SingleEnumInput;
