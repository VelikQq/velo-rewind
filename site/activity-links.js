// Only the explicit Strava Activity ID from CSV establishes a link. File names
// and FIT device IDs are not Strava IDs; demo activities never have links.
export function activityUrl(activity){const id=String(activity?.stravaId??'').trim();return activity?.source!=='DEMO'&&/^[1-9]\d*$/.test(id)?`https://www.strava.com/activities/${id}`:null;}
export function activityLink(activity,text='Тренировка в Strava ↗',inline=false){const url=activityUrl(activity);if(!url)return '';const label=String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));return `<a class="${inline?'activity-value':'activity-link'}" href="${url}" target="_blank" rel="noopener noreferrer" title="Открыть тренировку в Strava">${label}${inline?stravaMark:''}</a>`;}

const stravaMark='<svg class="strava-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/></svg>';
export function activityValue(activity,text){return activityLink(activity,text,true)||String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
