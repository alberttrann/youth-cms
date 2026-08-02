/**
 * MultiEnumInput - custom Strapi v5 field input.
 * Ponytail: braced JSX fragments kept literal through Python triple-quote string.
 */
import * as React from "react";
import { forwardRef, useCallback, useMemo } from "react";
import { useIntl } from "react-intl";
import { Field, Checkbox, Box, Flex, Typography } from "@strapi/design-system";
type Choice = { value: string; label: string };
const parseChoices = (raw: string | undefined): Choice[] => {
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean).map((entry) => {
    const eqIdx = entry.indexOf("=");
    if (eqIdx === -1) return { value: entry, label: entry };
    return { value: entry.slice(0, eqIdx).trim(), label: entry.slice(eqIdx + 1).trim() };
  });
};
const coerceToArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value.length) {
    return value.replace(/[\[\]]/g, "").split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};
export const MultiEnumInput = forwardRef<HTMLDivElement>((props, _ref) => {
  const { attribute, value, onChange, name, intlLabel, description, error, disabled, required } = props as any;
  const { formatMessage } = useIntl();
  const label = intlLabel ? formatMessage(intlLabel) : name;
  const hint = description;
  const choices = useMemo(() => parseChoices(attribute?.options?.choices), [attribute?.options?.choices]);
  const current = useMemo(() => coerceToArray(value), [value]);
  const handleToggle = useCallback((choiceValue: string) => {
    const next = current.includes(choiceValue) ? current.filter((v) => v !== choiceValue) : [...current, choiceValue];
    onChange({ target: { name, type: attribute?.type || "json", value: next } });
  }, [current, name, attribute?.type]);
  if (!choices.length) {
    return (
      <Field.Root error={error} hint={hint} required={required}>
        <Field.Label>{label}</Field.Label>
        <Box paddingTop={2} paddingBottom={2}>
          <Typography textColor="neutral500" variant="pi">No choices defined. Set options.choices on the field (e.g. 1=No Poverty,2=Zero Hunger,...,17=Partnerships)..</Typography>
        </Box>
        <Field.Hint />
        <Field.Error />
      </Field.Root>
    );
  }
  return (
    <Field.Root error={error} hint={hint} required={required}>
      <Field.Label>{label}</Field.Label>
      <Flex direction="column" alignItems="stretch" gap={2} paddingTop={2}>
        {choices.map((choice) => (
          <Checkbox key={choice.value} checked={current.includes(choice.value)} onChange={() => handleToggle(choice.value)} disabled={disabled}>
            {choice.label}
          </Checkbox>
        ))}
      </Flex>
      <Field.Hint />
      <Field.Error />
    </Field.Root>
  );
});
MultiEnumInput.displayName = "MultiEnumInput";
export default MultiEnumInput;
