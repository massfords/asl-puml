export type Must = <T>(nullable?: T) => asserts nullable;
export const must: Must = <T>(nullable?: T): asserts nullable => {
  if (!nullable) {
    throw Error("T must be truthy");
  }
};
