import admin from "firebase-admin";

console.log("Successfully imported firebase-admin");
try {
  console.log("firebase-admin version:", admin.SDK_VERSION);
} catch (e) {
  console.log("Could not get version");
}
