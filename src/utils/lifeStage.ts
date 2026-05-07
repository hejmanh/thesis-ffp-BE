type HasBeginningAge = {
  beginningAge: number | null;
};

export const adjustFirstBeginningAge = <T extends HasBeginningAge>(
  ranges: T[],
  newBeginningAge: number,
) => {
  if (ranges.length === 0) return ranges;

  const [first, ...rest] = ranges;
  const updatedFirst = { ...first, beginningAge: newBeginningAge } as T;
  return [updatedFirst, ...rest];
};
