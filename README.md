# Coal Watch Australia

Track the real-time status of coal generation units in Australia.

[<img width="1264" alt="image" src="https://github.com/user-attachments/assets/15824f7a-19f4-493f-8339-6f3d7323a610" />](https://coalwatch.com.au)

[coalwatch.com.au](https://coalwatch.com.au/)

## How it works

- Cron job calls the [OpenElectricity API](https://explore.openelectricity.org.au/) every 5 minutes
- Fetches all operating NEM coal facilities (black & brown) via `getFacilities`
- Pulls 5-minute interval power data for each unit via `getFacilityData`
- Compares current power output against unit capacity to determine active/inactive status
- Generates a 48-hour status history by aggregating 5-min readings into 30-min buckets
- Results stored as JSON blobs on Vercel Blob storage, served to the Next.js frontend with ISR revalidation
