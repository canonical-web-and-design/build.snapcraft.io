// Hardcoded since macaroons.js doesn't export these.
const CAVEAT_PACKET_TYPE_CID = 3;
const CAVEAT_PACKET_TYPE_VID = 4;
const CAVEAT_PACKET_TYPE_CL = 5;

export function* getCaveats(macaroon) {
  let currentCaveat = null;
  for (const caveatPacket of macaroon.caveatPackets) {
    switch (caveatPacket.type) {
      case CAVEAT_PACKET_TYPE_CID:
        if (currentCaveat !== null) {
          yield currentCaveat;
        }
        currentCaveat = {
          caveatId: caveatPacket.getValueAsText(),
          verificationKeyId: '',
          location: ''
        };
        break;
      case CAVEAT_PACKET_TYPE_VID:
        currentCaveat.verificationKeyId = caveatPacket.getValueAsText();
        break;
      case CAVEAT_PACKET_TYPE_CL:
        currentCaveat.location = caveatPacket.getValueAsText();
        break;
    }
  }
  if (currentCaveat !== null) {
    yield currentCaveat;
  }
}
