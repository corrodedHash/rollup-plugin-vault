declare module "virtual:checksum-*" {
  const checksum: {
    check: (value: string) => Promise<string>;
  };
  export default checksum;
}
