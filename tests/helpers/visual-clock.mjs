// Test-only clock shared by both production bundles. Explicit dates keep their meaning.
import { installFixedDate } from "./visual-clock-script.mjs";
installFixedDate(Number(process.env.ULUDOTT_VISUAL_EPOCH));
