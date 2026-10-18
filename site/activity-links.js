// Only the explicit Strava Activity ID from CSV establishes a link. File names
// and FIT device IDs are not Strava IDs; demo activities never have links.
export function activityUrl(activity){const id=String(activity?.stravaId??'').trim();return activity?.source!=='DEMO'&&/^[1-9]\d*$/.test(id)?`https://www.strava.com/activities/${id}`:null;}
export function activityLink(activity,text='Тренировка в Strava ↗'){const url=activityUrl(activity);if(!url)return '';const label=String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));return `<a class="activity-link" href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;}
