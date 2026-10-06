import { api,projectPath } from "./operationsApi";
import { uploadPhoto } from "./siteApi";

let database;
function openDatabase() {
  database ||= new Promise((resolve,reject) => {
    const request = indexedDB.open("xds-journal",1);
    request.onupgradeneeded = () => { request.result.createObjectStore("queue",{ keyPath:"key" }); request.result.createObjectStore("cache",{ keyPath:"key" }); };
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(new Error("Không thể mở bộ nhớ nhật ký trên thiết bị."));
  });
  return database;
}
async function transaction(store,mode,operation) {
  const db = await openDatabase();
  return new Promise((resolve,reject) => {
    const tx = db.transaction(store,mode); const request = operation(tx.objectStore(store));
    tx.oncomplete = () => resolve(request.result); tx.onerror = () => reject(tx.error || new Error("Không thể lưu trên thiết bị. Kiểm tra dung lượng bộ nhớ.")); tx.onabort = () => reject(tx.error);
  });
}
const cacheKey = (projectId,userId) => `project:${projectId}:user:${userId}`;
export const pendingJournals = async (projectId,userId) => (await transaction("queue","readonly",(store) => store.getAll())).filter((entry) => entry.projectId === Number(projectId) && entry.userId === userId).sort((a,b) => a.createdAt-b.createdAt);
export const savePending = (entry) => transaction("queue","readwrite",(store) => store.put(entry));
export const removePending = (key) => transaction("queue","readwrite",(store) => store.delete(key));
export const clearOfflineIdentity = () => transaction("cache","readwrite",(store) => store.delete("last-user"));
export async function loadJournals(projectId,signal) {
  try {
    const [{ user },data] = await Promise.all([api("/auth/me",{ signal }),api(projectPath(projectId,"/journals"),{ signal })]);
    const result = { user,data,offline:false };
    await transaction("cache","readwrite",(store) => store.put({ key:cacheKey(projectId,user.id),value:result }));
    await transaction("cache","readwrite",(store) => store.put({ key:"last-user",value:user.id }));
    return result;
  } catch (error) {
    if (signal.aborted || error.status) throw error;
    const last = await transaction("cache","readonly",(store) => store.get("last-user"));
    const stored = last && await transaction("cache","readonly",(store) => store.get(cacheKey(projectId,last.value)));
    if (!stored) throw new Error("Chưa có dữ liệu dự án lưu trên thiết bị. Kết nối mạng và mở nhật ký một lần trước khi làm việc offline.",{ cause:error });
    return { ...stored.value,offline:true };
  }
}
const running = new Map();
export async function syncJournals(projectId,userId) {
  const key = cacheKey(projectId,userId);
  if (running.has(key)) return running.get(key);
  const promise = (async () => {
    const { user } = await api("/auth/me");
    if (user.id !== userId) throw new Error("Đăng nhập đúng tài khoản đã ghi bản nháp để đồng bộ.");
    const entries = await pendingJournals(projectId,userId);
    let saved = 0;
    for (const entry of entries) {
      try {
        for (const photo of entry.photos) if (!photo.photoId) {
          const result = await uploadPhoto(projectId,entry.body.work_item_id,photo.file,photo.clientUuid);
          photo.photoId = result.id; await savePending(entry);
        }
        const body = { ...entry.body,photo_ids:[...new Set([...entry.body.photo_ids,...entry.photos.map((photo) => photo.photoId)])] };
        const response = await api(projectPath(projectId,"/journals/sync"),{ method:"POST",body:{ entries:[body] } });
        const result = response.results[0];
        if (!result.ok) throw new Error(result.message);
        await removePending(entry.key); saved++;
      } catch (error) { entry.error = error.message; await savePending(entry); }
    }
    return saved;
  })();
  running.set(key,promise);
  try { return await promise; } finally { running.delete(key); }
}
