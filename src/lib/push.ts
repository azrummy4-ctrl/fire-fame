import { savePushToken } from "@/lib/push.functions";

export type PushResult =
  | { status: "registered"; token: string }
  | { status: "not-configured" | "unsupported" | "open-in-new-tab" | "denied" | "failed" };

// Push registration click handler se hi call karo — bina gesture browser prompt nahi dikhata.
export async function enablePush(): Promise<PushResult> {
  const appId = import.meta.env["VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID"] as
    | string
    | undefined;
  const vapidKey = import.meta.env["VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY"] as
    | string
    | undefined;
  const apiKey = import.meta.env["VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY"] as
    | string
    | undefined;
  const projectId = import.meta.env["VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID"] as
    | string
    | undefined;

  if (!apiKey || !projectId || !appId || !vapidKey) {
    return { status: "not-configured" };
  }
  const firebaseConfig = {
    apiKey,
    projectId,
    appId,
    messagingSenderId: appId.split(":")[1] ?? "",
  };
  if (!firebaseConfig.messagingSenderId) {
    return { status: "not-configured" };
  }
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return { status: "unsupported" };
  }
  const { isSupported } = await import("firebase/messaging");
  if (!(await isSupported())) {
    return { status: "unsupported" };
  }
  if (window.top !== window.self) {
    return { status: "open-in-new-tab" };
  }

  const permission =
    Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") {
    return { status: "denied" };
  }

  try {
    const query = new URLSearchParams(
      Object.entries(firebaseConfig).filter(([, v]) => Boolean(v)) as [string, string][],
    ).toString();
    const serviceWorkerRegistration = await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${query}`,
    );
    const { initializeApp } = await import("firebase/app");
    const { getMessaging, getToken } = await import("firebase/messaging");
    const messaging = getMessaging(initializeApp(firebaseConfig));
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration });
    if (!token) return { status: "denied" };

    await savePushToken({ data: { token, platform: "web" } });
    return { status: "registered", token };
  } catch (error) {
    console.error("Push registration failed", error);
    return { status: "failed" };
  }
}

// Android APK (WebView) me service worker nahi chalta, isliye APK ka native
// FCM token Kotlin se window.saveAndroidPushToken(token) ke through aata hai
// aur yahi usse backend me save karta hai (same fanout pipeline).
let androidBridgeInstalled = false;
export function installAndroidPushBridge() {
  if (androidBridgeInstalled || typeof window === "undefined") return;
  androidBridgeInstalled = true;
  const saveAndroidToken = async (token: unknown) => {
    if (typeof token !== "string" || token.length < 10) return;
    try {
      await savePushToken({ data: { token, platform: "android" } });
    } catch (error) {
      console.error("Android push token save failed", error);
    }
  };
  Object.assign(window, { saveAndroidPushToken: saveAndroidToken });
}
