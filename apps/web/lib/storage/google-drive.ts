import {google} from "googleapis"


const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"]
})


const drive = google.drive({
    version: "v3",
    auth,
});

export async function downloadGoogleDriveZip(url: string) {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)

    if (!match) {
        throw new Error("Invalid Google drive URL.")
    }


    const fileId = match[1];

    const response = await drive.files.get(
        {
            fileId,
            alt: "media"
        },
        {
            responseType: "arraybuffer",
        }
    )

    return Buffer.from(response.data as ArrayBuffer)
}