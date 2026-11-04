// Shared by every place that names a board or category, so they all refuse a name the same way
export const nameRequiredAlert = thing => ({
  display: true,
  title: "Name, please! ✏️",
  textValue: `Every ${thing} needs a name, even a short one.`,
});

export const CATEGORY_NAME_TAKEN_ALERT = {
  display: true,
  title: "Already taken 👯",
  textValue: "This board already has a category with that name. Try another one.",
};
