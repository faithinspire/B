import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
const root = process.cwd();

const path = resolve(root, 'app/(braider)/braider/messages/[booking_id]/page.tsx');
let content = readFileSync(path, 'utf8');

// 1. Update hook destructuring to include currentPosition
content = content.replace(
  'const { isTracking, startTracking, stopTracking } = useBraiderLocationTracking(booking_id);',
  'const { isTracking, startTracking, stopTracking, currentPosition } = useBraiderLocationTracking(booking_id);'
);

// 2. Pass currentPosition to BraiderLocationMap
content = content.replace(
  '<BraiderLocationMap booking_id={booking_id}',
  '<BraiderLocationMap booking_id={booking_id} braiderCurrentLocation={currentPosition}'
);
content = content.replace(
  '<BraiderLocationMap booking_id={booking_id} />',
  '<BraiderLocationMap booking_id={booking_id} braiderCurrentLocation={currentPosition} />'
);

writeFileSync(path, content, 'utf8');
console.log('✅ Patched braider chat page');
