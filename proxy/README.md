# playit.gg access (WaterdogPE proxy)

Why: BDS 1.26.6x only speaks NetherNet, and playit's guide says BDS can't use its tunnel directly; WaterdogPE
sits in between (https://playit.gg/support/minecraft-bedrock-nethernet/). Chain:
friends -> playit tunnel (Minecraft Bedrock (NetherNet)) -> WaterdogPE on 19132 -> BDS on 127.0.0.1:19142.

Friends-only: BDS's allow-list must be off behind the proxy, so `addons/TACZ-B/scripts/config/access.js`
kicks anyone not on the friends list (WaterdogPE verifies Xbox sign-in, so gamertags are genuine).

Host PC setup (once):
1. Install Java 17+ (https://adoptium.net) and put Waterdog.jar from the official releases page in this folder.
2. playit: create tunnel type "Minecraft Bedrock (NetherNet)" -> Configuration help -> WaterdogPE tab.
3. server.properties lines from that tab go into the repo (they are not secret). config.yml sections stay ONLY
   on the PC (they contain the tunnel token; this folder is git-ignored).
4. Run start-proxy.bat once, type `end`, paste the listener/servers/nethernet sections + online_mode,
   upstream_encryption, use_login_extras, enable_edu_features into config.yml. Start again; success =
   "Registered with the external signaling service".
Run order: start-server.bat, then start-proxy.bat, with playit running.
