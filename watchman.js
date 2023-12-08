const watchman = require("fb-watchman");
const client = new watchman.Client();
const { execa } = require("@esm2cjs/execa");
const { join } = require("path");

const dir_of_interest = join(process.cwd(), "settings");

// `watch` is obtained from `resp.watch` in the `watch-project` response.
// `relative_path` is obtained from `resp.relative_path` in the
// `watch-project` response.
function make_subscription(client, watch, relative_path, onChange) {
  sub = {
    // Match any `.js` file in the dir_of_interest
    expression: ["allof", ["match", "*.js"]],
    // Which fields we're interested in
    fields: ["name", "size", "mtime_ms", "exists", "type"],
  };
  if (relative_path) {
    sub.relative_root = relative_path;
  }

  client.command(
    ["subscribe", watch, "subscription", sub],
    function (error, resp) {
      if (error) {
        // Probably an error in the subscription criteria
        console.error("failed to subscribe: ", error);
        return;
      }
      console.log("subscription " + resp.subscribe + " established");
    }
  );

  // Subscription results are emitted via the subscription event.
  // Note that this emits for all subscriptions.  If you have
  // subscriptions with different `fields` you will need to check
  // the subscription name and handle the differing data accordingly.
  // `resp`  looks like this in practice:
  //
  // { root: '/private/tmp/foo',
  //   subscription: 'mysubscription',
  //   files: [ { name: 'node_modules/fb-watchman/index.js',
  //       size: 4768,
  //       exists: true,
  //       type: 'f' } ] }
  client.on("subscription", async function (resp) {
    if (resp.subscription !== "subscription") return;

    resp.files.forEach(function (file) {
      // convert Int64 instance to javascript integer
      const mtime_ms = +file.mtime_ms;

      console.log("file changed: " + file.name, mtime_ms);
    });

    await onChange();
  });
}

client.command(["watch-project", dir_of_interest], function (error, resp) {
  if (error) {
    console.error("Error initiating watch:", error);
    return;
  }

  // It is considered to be best practice to show any 'warning' or
  // 'error' information to the user, as it may suggest steps
  // for remediation
  if ("warning" in resp) {
    console.log("warning: ", resp.warning);
  }

  make_subscription(client, resp.watch, resp.relative_path, async () => {
    try {
      console.log("Rebuilding project...");
      await execa(`npm`, ["run", "build"]);
      console.log("Rebuilt!");
    } catch (e) {
      console.error(e);
    }
  });
});
