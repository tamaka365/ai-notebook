import { readDir } from "../src/lib/fs/notes";

async function main() {
  console.log("Testing readDir()...");
  const nodes = await readDir();
  console.log("Returned nodes count:", nodes.length);
  console.log(JSON.stringify(nodes, null, 2));
}

main().catch(console.error);
