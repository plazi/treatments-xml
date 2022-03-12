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

Deno.mkdirSync(xmlRepoDir, { recursive: true });

// Clone repository again, but without a working copy but with full history
const cloning = await exec([
  "git",
  "clone",
  "--filter=blob:none",
  "--no-checkout",
  "--single-branch",
  "--branch",
  "main",
  `https://github.com/${repoName}.git`,
  xmlRepoDir,
]);
console.log(cloning.status.success, cloning.stderr, "<-->", cloning.stdout)

for await (
  const file of walk(ttlDir, { includeDirs: false })
) {
  const filepath = file.path.substring(ttlDir.length + 1);
  const filepathXML = filepath.replace(/.ttl$/, ".xml");
  console.log("FOUND      ", filepath, `(${filepathXML})`);
  const { stdout: destinationChangeMsg, stderr: stderrDCM, status: statusDCM } =
    await exec(
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
  if (stderrDCM) console.log("E-DCM:", stderrDCM);
  const destinationChangeHash =
    destinationChangeMsg.split(`${repoName}@`)[1]?.split("\n")[0];
  if (!destinationChangeHash || !statusDCM.success) {
    replaceFile(filepath);
    continue;
  }
  const {
    stdout: destinationChangeDate,
    stderr: stderrDCD,
    status: statusDCD,
  } = await exec(
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
  if (stderrDCD) console.log("E-DCD:", stderrDCD);
  console.log(
    `- Destination is based on ${destinationChangeHash} from ${
      destinationChangeDate || "<future>"
    }`,
  );
  if (!destinationChangeDate || !statusDCD.success) {
    keepFile(filepath);
    continue;
  }
  const { stdout: thisChangeDate, stderr: stderrTCD } = await exec(
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
  if (stderrTCD) console.log("E-TCD:", stderrTCD);
  console.log(
    `- Our changes are based on a commit from ${thisChangeDate}`,
  );
  if (parseInt(destinationChangeDate, 10) >= parseInt(thisChangeDate, 10)) {
    keepFile(filepath);
    continue;
  }
  replaceFile(filepath);
}
