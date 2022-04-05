jQuery(document).ready(function(){
	pnVersionsRequest.done(function(data){
    let stableReleases = $("#stable-releases").empty();
		data.releases.map(buildVersion).forEach(function(node){
      stableReleases.append(node);
      node.find('[data-toggle="tooltip"]').tooltip()
    });
    let unstableVersions = $("#unstable-versions").empty();
    data.snapshots.map(buildVersion).forEach(function(node){
      unstableVersions.append(node);
      node.find('[data-toggle="tooltip"]').tooltip();
      node.find(".download-jar-button").removeClass("btn-primary").addClass("btn-outline-secondary");
    });
	}).fail(function(){
		alert("Failed to load the version list!");
	});
});


function buildVersion(data, index) {
  let artefacts = {};
  data.artefacts.forEach(function(artefactId) {
    artefacts[artefactId] = buildArtefactUrl(data, artefactId);
  });
  if (data.commitId) {
    artefacts.GIT_SOURCE = buildArtefactUrl(data, "GIT_SOURCE");
  }
  if (!data.snapshotBuild) {
    artefacts.ONLINE_DOC = buildArtefactUrl(data, "ONLINE_DOC");
  }
  
  let releaseTime = new Date(data.releaseTime);
  let timezoneOffset = releaseTime.getTimezoneOffset();
  releaseTime = new Date(releaseTime.getTime() - (timezoneOffset*60*1000));
  let timeParts = releaseTime.toISOString().split("T");
  let releaseDate = timeParts[0];
  releaseTime = timeParts[1].split(".")[0];
  
  let node = $("#download-line-sample").clone().removeAttr("id").removeClass("d-none");
  if ((index % 2) == 0) {
    node.addClass("bg-light");
  }
  let cleanVersion = data.version;
  if (data.snapshotBuild) {
    let snapshotIndex = cleanVersion.indexOf("-SNAPSHOT");
    cleanVersion = cleanVersion.substring(0, snapshotIndex + 9);
  }
  node.find(".pn-version").text(cleanVersion);
  node.find(".release-date").text(releaseDate);
  node.find(".release-time").text(releaseTime);
  node.find(".minecraft-version").text(data.minecraftVersion)
  let url = getBestDownloadUrl(artefacts);
  if (url) {
    node.find(".download-jar-button")
      .attr("title", "PowerNukkit "+data.version+" for Minecraft Bedrock Edition "+data.minecraftVersion)
      .attr("href", url);
  } else {
    node.remove("download-jar-button");
  }
  url = getBestSourceUrl(artefacts);
  if (url) {
    node.find(".download-src-button")
      .attr("title", "Browse or download the source code of PowerNukkit "+data.version)
      .attr("href", url);
  } else {
    node.remove("download-src-button");
  }
  url = getBestDocsUrl(artefacts);
  if (url) {
    node.find(".read-docs-button")
      .attr("title", "Browse the JavaDocs and JDiffs of the PowerNukkit "+data.version)
      .attr("href", url);
  } else {
    node.remove("read-docs-button")
  }
  return node;
}
          
function getBestDownloadUrl(artefacts) {
  if (artefacts.SHADED_JAR) {
    return artefacts.SHADED_JAR;
  } else {
    return artefacts.REDUCED_JAR;
  }
}

function getBestSourceUrl(artefacts) {
  if (artefacts.GIT_SOURCE) {
    return artefacts.GIT_SOURCE;
  } else if (artefacts.SHADED_SOURCES_JAR) {
    return artefacts.SHADED_SOURCES_JAR;
  } else {
    return artefacts.REDUCED_SOURCES_JAR;
  }
}

function getBestDocsUrl(artefacts) {
  if (artefacts.ONLINE_DOC) {
    return artefacts.ONLINE_DOC;
  } else {
    return artefacts.JAVADOC_JAR;
  }
}

function buildArtefactUrl(data, artefactId) {
  if (artefactId == "GIT_SOURCE") {
    return buildGitSourceUrl(data);
  } else if (artefactId == "ONLINE_DOC") {
    return buildOnlineDocUrl(data);
  } else if (data.snapshotBuild) {
    return buildSnapshotArtefactUrl(data, artefactId);
  } else {
    return buildReleaseArtefactUrl(data, artefactId);
  }
}

function buildOnlineDocUrl(data) {
  if (data.snapshotBuild) {
    if (data.artefacts.includes("JAVADOC_JAR")) {
      return buildSnapshotArtefactUrl(data, "JAVADOC_JAR");
    }
  }
  return "https://devs.powernukkit.org/#javadoc";
}

function buildGitSourceUrl(data) {
  if (data.commitId) {
    return "https://github.com/PowerNukkit/PowerNukkit/tree/" + data.commitId;
  } else if (data.snapshotBuild) {
    if (data.artefacts.includes("SHADED_SOURCES_JAR")) {
      return buildSnapshotArtefactUrl(data, "SHADED_SOURCES_JAR");
    } else if (data.artefacts.includes("REDUCED_SOURCES_JAR")) {
      return buildSnapshotArtefactUrl(data, "REDUCED_SOURCES_JAR");
    }
  } else {
    if (data.artefacts.includes("SHADED_SOURCES_JAR")) {
      return buildReleaseArtefactUrl(data, "SHADED_SOURCES_JAR");
    } else if (data.artefacts.includes("REDUCED_SOURCES_JAR")) {
      return buildReleaseArtefactUrl(data, "REDUCED_SOURCES_JAR");
    }
  }
}

function buildReleaseArtefactUrl(data, artefactId) {
  if (!data.artefacts.includes(artefactId)) {
    return;
  }
  return "https://search.maven.org/remotecontent?filepath=org/powernukkit/powernukkit/" +
    data.version +
    "/powernukkit-" +
    data.version +
    getArtefactExtension(artefactId);
}

function buildSnapshotArtefactUrl(data, artefactId) {
  if (!data.artefacts.includes(artefactId)) {
    return;
  }
  let dt = new Date(data.releaseTime);
  let snapshotCode = dt.getUTCFullYear().toString().padStart(4, "0") +
      dt.getUTCMonth().toString().padStart(2, "0") +
      dt.getUTCDay().toString().padStart(2, "0") +
      "." +
      dt.getUTCHours().toString().padStart(2, "0") +
      dt.getUTCMinutes().toString().padStart(2, "0") +
      dt.getUTCSeconds().toString().padStart(2, "0") +
      "-" +
      data.snapshotBuild;
  let snapshotIndex = data.version.indexOf("-SNAPSHOT");
  let version =  data.version.substring(0, snapshotIndex);
  let extension = getArtefactExtension(artefactId);
  return "https://oss.sonatype.org/content/repositories/snapshots/org/powernukkit/powernukkit" +
    "/" +
    version + "-SNAPSHOT" +
    "/" +
    "powernukkit-" + version +
    "-" +
    snapshotCode +
    extension
}

function getArtefactExtension(artefactId) {
  let extension = ".unknown";
  switch (artefactId) {
    case "REDUCED_JAR": extension = ".jar"; break;
    case "REDUCED_SOURCES_JAR": extension = "-sources.jar"; break;
    case "SHADED_JAR": extension = "-shaded.jar"; break;
    case "SHADED_SOURCES_JAR": extension = "-shaded-sources.jar"; break;
    case "JAVADOC_JAR": extension = "-javadoc.jar"; break;
  }
  return extension;
}
