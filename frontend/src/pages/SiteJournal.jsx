import { useEffect,useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { JournalOverview } from "../components/ModuleInsights";
import Icon from "../components/OperationsIcon";
import RecordEditor from "../components/RecordEditor";
import { Empty,Field,FormActions,Modal,NoProject,Notice,RemoteState } from "../components/OperationsUI";
import { api,dateLabel,projectPath,today } from "../services/operationsApi";
import { photoUrl } from "../services/siteApi";
import { loadJournals,pendingJournals,removePending,savePending,syncJournals } from "../services/journalOffline";
import { validProjectId } from "../services/navigation";
import "../styles/SiteModules.css";

function LocalPhoto({ file }) {
  const [url,setUrl] = useState("");
  useEffect(() => { const next = URL.createObjectURL(file); Promise.resolve().then(() => setUrl(next)); return () => URL.revokeObjectURL(next); },[file]);
  return <img src={url || undefined} alt={file.name} />;
}
function JournalForm({ projectId,user,data,record,pending,onClose,onSaved }) {
  const initialDay = record?.day || today();
  const info = data.journals.find((entry) => entry.day === initialDay);
  const isLocked = Boolean(record?.is_locked || record?.locked || info?.is_locked || info?.locked);
  const [values,setValues] = useState(pending?.body || record || { work_item_id:"",day:initialDay,time:new Date().toTimeString().slice(0,5),content:"",manpower:info?.manpower ?? 0,equipment:info?.equipment || "",weather:info?.weather || "",daily_revision:info?.daily_revision || 0,photo_ids:[],client_uuid:crypto.randomUUID() });
  const [photos,setPhotos] = useState(pending?.photos || []);
  const [busy,setBusy] = useState(false); const [error,setError] = useState("");
  const change = (event) => setValues({ ...values,[event.target.name]:event.target.value });
  async function changeDay(event) {
    const day = event.target.value;
    const cached = data.journals.find((entry) => entry.day === day);
    setValues((current) => ({ ...current,day,manpower:cached?.manpower ?? 0,equipment:cached?.equipment || "",weather:cached?.weather || "",daily_revision:cached?.daily_revision || 0 }));
    try { const result = await api(projectPath(projectId,`/journals/daily?day=${day}`)); if (result.daily) setValues((current) => current.day === day ? { ...current,manpower:result.daily.manpower,equipment:result.daily.equipment,weather:result.daily.weather,daily_revision:result.daily.revision } : current); }
    catch { /* Offline: the stored day's revision is checked during sync. */ }
  }
  async function save(event) {
    event.preventDefault();
    if (isLocked) { setError("Nhật ký ngày đã bị khóa sổ, không thể chỉnh sửa hoặc xóa."); return; }
    setBusy(true); setError("");
    try {
      const uuid = values.client_uuid || crypto.randomUUID();
      await savePending({ key:pending?.key || `${user.id}:${projectId}:${uuid}`,projectId:Number(projectId),userId:user.id,createdAt:pending?.createdAt || Date.now(),photos,
        body:{ ...values,id:record?.id || values.id || null,client_uuid:uuid,work_item_id:Number(values.work_item_id),manpower:Number(values.manpower),time:values.time.slice(0,5),photo_ids:values.photo_ids || [] },error:null });
      onSaved();
    } catch (failure) { setError(failure.message); setBusy(false); }
  }
  return <Modal variant="drawer" title={<span>{record || pending ? "Chi tiết / Chỉnh sửa nhật ký" : "Ghi nhật ký công trường"}{isLocked && <span className="ops-badge ops-badge-gray" style={{ marginLeft: 8 }}>Đã khóa sổ</span>}</span>} busy={busy} onClose={onClose}>
    {isLocked ? <Notice tone="error">Nhật ký ngày đã bị khóa sổ, không thể chỉnh sửa hoặc xóa.</Notice> : <Notice tone="error">{error}</Notice>}
    <form onSubmit={save}>
    <Field label="Hạng mục"><select name="work_item_id" value={values.work_item_id} onChange={change} required disabled={isLocked}><option value="">Chọn hạng mục</option>{data.items.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></Field>
    <div className="ops-grid-two"><Field label="Ngày"><input type="date" name="day" value={values.day} onChange={changeDay} required disabled={isLocked} /></Field><Field label="Giờ"><input type="time" name="time" value={values.time.slice(0,5)} onChange={change} required disabled={isLocked} /></Field></div>
    <Field label="Nội dung công việc"><textarea name="content" value={values.content} onChange={change} maxLength={20000} required disabled={isLocked} /></Field>
    <div className="ops-grid-two"><Field label="Nhân lực trong ngày"><input name="manpower" type="number" value={values.manpower} onChange={change} min={0} max={1000000} step={1} required disabled={isLocked} /></Field><Field label="Thời tiết"><input name="weather" value={values.weather} onChange={change} maxLength={255} required disabled={isLocked} /></Field></div>
    <Field label="Thiết bị trong ngày"><textarea name="equipment" value={values.equipment} onChange={change} maxLength={5000} disabled={isLocked} /></Field>
    {!isLocked && <Field label="Ảnh hiện trường (tối đa 10 MB/ảnh)"><input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={isLocked} onChange={(event) => {
      const files = Array.from(event.target.files); event.target.value = "";
      if (files.some((file) => file.size > 10*1024*1024) || photos.length+files.length+(values.photo_ids?.length || 0)>20) { setError("Tối đa 20 ảnh, mỗi ảnh không quá 10 MB."); return; }
      setPhotos([...photos,...files.map((file) => ({ file,clientUuid:crypto.randomUUID() }))]);
    }} /></Field>}
    <div className="ops-photo-picker">{photos.map((photo) => <div key={photo.clientUuid}><LocalPhoto file={photo.file} />{!isLocked && <button className="ops-btn ops-small" type="button" onClick={() => setPhotos(photos.filter((entry) => entry.clientUuid !== photo.clientUuid))}>Bỏ ảnh</button>}</div>)}{values.photo_ids?.map((id) => <div key={id}><img src={photoUrl(projectId,id)} alt={`Ảnh ${id}`} />{!isLocked && <button className="ops-btn ops-small" type="button" onClick={() => setValues({ ...values,photo_ids:values.photo_ids.filter((value) => value !== id) })}>Bỏ ảnh</button>}</div>)}</div>
    <Notice>Bản ghi và ảnh được lưu trên thiết bị trước khi đồng bộ. Nhật ký đã khóa sổ sẽ không thể chỉnh sửa.</Notice>
    {isLocked ? <div className="ops-form-actions"><button className="ops-btn" type="button" onClick={onClose}>Đóng</button></div> : <FormActions busy={busy} onClose={onClose} label="Lưu nhật ký" />}
  </form></Modal>;
}
function ProjectJournal({ projectId }) {
  const [attempt,setAttempt] = useState(0);
  const [state,setState] = useState({ loading:true,data:null,error:null,user:null,offline:false });
  const [queue,setQueue] = useState([]);
  const [modal,setModal] = useState(null); const [message,setMessage] = useState("");
  const [filters,setFilters] = useState({ day:"",item:"",author:"",sync:"" });
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        let result = await loadJournals(projectId,controller.signal);
        if (!result.offline) { const count = await syncJournals(projectId,result.user.id); if (count) result = await loadJournals(projectId,controller.signal); }
        const pending = await pendingJournals(projectId,result.user.id);
        if (!controller.signal.aborted) { setState({ ...result,loading:false,error:null }); setQueue(pending); }
      } catch (error) { if (!controller.signal.aborted) setState({ loading:false,data:null,user:null,error }); }
    }
    load(); return () => controller.abort();
  },[projectId,attempt]);
  useEffect(() => { const online = () => setAttempt((value) => value+1); window.addEventListener("online",online); return () => window.removeEventListener("online",online); },[]);
  const reload = () => { setState((current) => ({ ...current,loading:true })); setAttempt((value) => value+1); };
  function saved() { setModal(null); setMessage("Đã lưu. Nhật ký có kết nối mạng sẽ tự đồng bộ."); reload(); }
  const data = state.data; const canWrite = ["admin","project_manager","manager","engineer"].includes(data?.member_role);
  const journals = (data?.journals || []).filter((entry) => (!filters.day || entry.day === filters.day) && (!filters.item || entry.work_item_id === Number(filters.item)) && (!filters.author || entry.author_id === Number(filters.author)));
  const authors = [...new Map((data?.journals || []).map((entry) => [entry.author_id,entry.author])).entries()];
  return <><Notice tone="success">{message}</Notice>{state.offline && <Notice tone="warning">Đang làm việc offline. Nhật ký lưu trên thiết bị sẽ tự đồng bộ khi có mạng.</Notice>}<RemoteState state={{ ...state,reload }}>{data && <>
    <JournalOverview journals={data.journals} queue={queue} offline={state.offline} />
    <section className="ops-card journal-timeline-card"><div className="ops-card-head"><div><h2>Nhật ký công trường</h2><p>Nội dung thi công, nhân lực, thiết bị và ảnh theo ngày.</p></div><div className="ops-actions"><button className="ops-btn" onClick={reload}>Đồng bộ / tải lại</button>{canWrite && <><button className="ops-btn" onClick={() => setModal({ kind:"lock" })}>Khóa / mở sổ</button><button className="ops-btn ops-create" onClick={() => setModal({ kind:"entry" })}>＋ Ghi nhật ký</button></>}</div></div>
      <div className="ops-toolbar"><label>Ngày<input type="date" value={filters.day} onChange={(event) => setFilters({ ...filters,day:event.target.value })} /></label><label>Hạng mục<select value={filters.item} onChange={(event) => setFilters({ ...filters,item:event.target.value })}><option value="">Tất cả</option>{data.items.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label>Người ghi<select value={filters.author} onChange={(event) => setFilters({ ...filters,author:event.target.value })}><option value="">Tất cả</option>{authors.map(([id,name]) => <option key={id} value={id}>{name}</option>)}</select></label><label>Đồng bộ<select value={filters.sync} onChange={(event) => setFilters({ ...filters,sync:event.target.value })}><option value="">Tất cả</option><option value="synced">Đã đồng bộ</option><option value="pending">Chưa đồng bộ</option></select></label></div>
      {filters.sync !== "synced" && queue.length > 0 && <div className="ops-sync-queue"><strong>Bản ghi trên thiết bị</strong>{queue.map((entry) => <article key={entry.key}><p>{dateLabel(entry.body.day)} · {data.items.find((item) => item.id === entry.body.work_item_id)?.title}</p><p className="ops-note">{entry.body.content}</p><small>{entry.error || "Chưa đồng bộ"}</small><div className="ops-row-actions"><button className="ops-btn ops-small" onClick={() => setModal({ kind:"entry",pending:entry })}>Sửa bản nháp</button><button className="ops-btn ops-small ops-danger" onClick={() => setModal({ kind:"remove-pending",pending:entry })}>Xóa bản nháp</button></div></article>)}</div>}
      {filters.sync !== "pending" && (journals.length ? <div className="ops-journal-grid">{journals.map((entry) => {
        const isEntryLocked = Boolean(entry.is_locked || entry.locked);
        return <article className="ops-journal-entry" key={entry.id}><header><div><small>{dateLabel(entry.day)} · {entry.time.slice(0,5)}</small><h3>{entry.item_name}</h3></div><span className={`ops-badge ops-badge-${isEntryLocked ? "gray" : "green"}`}>{isEntryLocked ? "Đã khóa sổ" : "Đã đồng bộ"}</span></header><p>{entry.content}</p><div className="ops-journal-meta"><span><Icon name="users" size={15}/>{entry.manpower} nhân lực</span><span><Icon name="calendar" size={15}/>{entry.weather}</span>{entry.equipment && <span>Thiết bị: {entry.equipment}</span>}</div><div className="ops-photo-picker">{entry.photo_ids.map((id) => <a key={id} href={photoUrl(projectId,id,true)} target="_blank" rel="noreferrer"><img loading="lazy" src={photoUrl(projectId,id)} alt={`Ảnh nhật ký ${id}`} /></a>)}</div><footer><small className="journal-author"><span>{entry.author?.slice(0,1)}</span>{entry.author}</small>{isEntryLocked ? <button className="ops-btn ops-small" onClick={() => setModal({ kind:"entry",record:entry })}>Xem chi tiết</button> : (canWrite && (entry.author_id === state.user.id || ["admin","project_manager","manager"].includes(data.member_role)) && <div className="ops-row-actions"><button className="ops-btn ops-small" onClick={() => setModal({ kind:"entry",record:entry })}>Sửa</button><button className="ops-btn ops-small ops-danger" onClick={() => setModal({ kind:"delete",record:entry })}>Xóa</button></div>)}</footer></article>;
      })}</div> : <Empty icon="document" title="Lưu lại diễn biến mỗi ngày">Chưa có nhật ký phù hợp. Ghi nhật ký đầu tiên để lưu diễn biến công trường.</Empty>)}
      {filters.sync === "pending" && !queue.length && <Empty>Không có bản ghi chờ đồng bộ.</Empty>}
    </section></>}</RemoteState>
    {modal?.kind === "entry" && <JournalForm projectId={projectId} user={state.user} data={data} {...modal} onClose={() => setModal(null)} onSaved={saved} />}
    {modal?.kind === "lock" && <RecordEditor title="Khóa / mở sổ nhật ký" initial={{ day:filters.day || today(),locked:"true",reason:"" }} fields={[{ name:"day",label:"Ngày",type:"date" },{ name:"locked",label:"Thao tác",type:"select",options:[{ value:"true",label:"Khóa sổ" },...(data.member_role === "admin" ? [{ value:"false",label:"Mở khóa" }] : [])] },{ name:"reason",label:"Lý do mở khóa",type:"textarea",when:(values) => values.locked === "false" }]} submit={(values) => api(projectPath(projectId,"/journals/lock"),{ method:"POST",body:{ ...values,is_locked:values.locked === "true",locked:values.locked === "true" } })} onClose={() => setModal(null)} onSaved={saved} />}
    {modal?.kind === "delete" && <RecordEditor title="Xóa nhật ký" initial={{}} onClose={() => setModal(null)} onSaved={saved} submitLabel="Xóa nhật ký" submit={() => api(projectPath(projectId,`/journals/${modal.record.id}`),{ method:"DELETE",body:{ revision:modal.record.revision } })}><p>Xóa nhật ký ngày {dateLabel(modal.record.day)}? Thao tác sẽ được ghi vào nhật ký hệ thống.</p></RecordEditor>}
    {modal?.kind === "remove-pending" && <RecordEditor title="Xóa bản nháp trên thiết bị" initial={{}} onClose={() => setModal(null)} onSaved={saved} submitLabel="Xóa bản nháp" submit={() => removePending(modal.pending.key)}><p>Bản ghi và ảnh chưa đồng bộ trong bản nháp này sẽ bị xóa khỏi thiết bị.</p></RecordEditor>}
  </>;
}
export default function SiteJournal() { const [params] = useSearchParams(); const projectId = params.get("projectId"); return <DashboardLayout title="Nhật ký công trường" description="Ghi nhận diễn biến thi công mỗi ngày, hỗ trợ làm việc khi mất kết nối.">{validProjectId(projectId) ? <ProjectJournal key={projectId} projectId={projectId} /> : <NoProject />}</DashboardLayout>; }
