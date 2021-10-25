/**
 * Draw random element and remove it from array.
 * @param {bool} replacement: sample with replacement or not, default to true
 * @returns element been drawn
 */
export const sample = (array: any[], replacement = true) => {
  // random index
  const index = Math.floor(Math.random() * array.length);
  const el = array[index];

  // remove element
  if (!replacement) {
    array.splice(index, 1);
  }

  return el;
};

/**
 * Capitalize first letter of a string
 * @returns the capitalized string
 */
export const capitalize = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};
