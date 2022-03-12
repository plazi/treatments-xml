import { exec } from "./exec.ts";
import { walk } from "https://deno.land/std/fs/mod.ts";

const rootDir = Deno.realPathSync(
  Deno.env.get("GITHUB_WORKSPACE") || Deno.cwd(),
);
const repoName = Deno.env.get("GITHUB_REPOSITORY") || "plazi/treatments-xml";
const ttlDir = rootDir + "/ttl";
const ttlRepoDir = rootDir + "/ttl-repo";
const xmlRepoDir = rootDir + "/xml-repo";

function replaceFile(name: string) {
  console.log("> REPLACING", name);
  console.log("           ", ttlRepoDir + "/" + name.replace(/\/?[^\/]+$/, ""));
  Deno.mkdirSync(ttlRepoDir + "/" + name.replace(/\/?[^\/]+$/, ""), {
    recursive: true,
  });
  Deno.renameSync(ttlDir + "/" + name, ttlRepoDir + "/" + name);
}

function keepFile(name: string) {
  console.log("> KEEPING  ", name);
}

// Clone repository again, but without a working copy but with full history
exec([
  "git",
  "clone",
  "--filter=blob:none",
  "--no-checkout",
  "--single-branch",
  "--branch",
  "main",
  `git@github.com:${repoName}.git`,
  xmlRepoDir
]);

for await (
  const file of walk(ttlDir, { includeDirs: false })
) {
  const filepath = file.path.substring(ttlDir.length + 1);
  const filepathXML = filepath.replace(/.ttl$/, ".xml");
  console.log("FOUND      ", filepath, `(${filepathXML})`);
  const { stdout: destinationChangeMsg, stderr } = await exec(
    [
      "git",
      "log",
      `--grep=${repoName}@`,
      "-F",
      "-n",
      "1",
      `--format=%s`,
      "--",
      filepath,
    ],
    ttlRepoDir,
  );
  const destinationChangeHash =
    destinationChangeMsg.split(`${repoName}@`)[1]?.split("\n")[0];
  if (stderr) console.log(stderr);
  if (!destinationChangeHash) {
    replaceFile(filepath);
    continue;
  }
  const { stdout: destinationChangeDate } = await exec(
    [
      "git",
      "log",
      "-n",
      "1",
      `--format=%ct`,
      destinationChangeHash,
    ],
    xmlRepoDir,
  );
  console.log(
    `- Destination is based on ${destinationChangeHash} from ${
      destinationChangeDate || "<future>"
    }`,
  );
  if (!destinationChangeDate) {
    keepFile(filepath);
    continue;
  }
  const { stdout: thisChangeDate } = await exec(
    [
      "git",
      "log",
      "-n",
      "1",
      `--format=%ct`,
      "--",
      filepathXML,
    ],
    xmlRepoDir,
  );
  console.log(
    `- Our changes are based on a commit from ${thisChangeDate}`,
  );
  if (destinationChangeDate >= thisChangeDate) {
    keepFile(filepath);
    continue;
  }
  replaceFile(filepath);
}
