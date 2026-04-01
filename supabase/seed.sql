insert into public.body_parts (key, name_ko, color_hex, display_order)
values
  ('shoulders', '어깨', '#f4c542', 1),
  ('chest', '가슴', '#e35d5b', 2),
  ('back', '등', '#4f7cff', 3),
  ('biceps', '이두', '#8b5cf6', 4),
  ('triceps', '삼두', '#f28a2e', 5),
  ('abs', '복근', '#7a8698', 6),
  ('quads', '전면하체', '#2bb673', 7),
  ('hamstrings', '후면하체', '#117a54', 8)
on conflict (key) do update
set
  name_ko = excluded.name_ko,
  color_hex = excluded.color_hex,
  display_order = excluded.display_order;

with brand_seed(name) as (
  values
    ('Hammer Strength'),
    ('Technogym'),
    ('Life Fitness'),
    ('Matrix'),
    ('Cybex'),
    ('Gym80'),
    ('Panatta'),
    ('Atlantis'),
    ('Prime'),
    ('Nautilus'),
    ('Newtech'),
    ('DRAX')
)
insert into public.brand_definitions (name, owner_user_id, is_system)
select seed.name, null, true
from brand_seed seed
where not exists (
  select 1
  from public.brand_definitions brands
  where brands.owner_user_id is null
    and lower(brands.name) = lower(seed.name)
);

with exercise_seed(name, body_part_key, exercise_type) as (
  values
    ('바벨 벤치프레스', 'chest', 'barbell'),
    ('인클라인 바벨 벤치프레스', 'chest', 'barbell'),
    ('덤벨 벤치프레스', 'chest', 'dumbbell'),
    ('인클라인 덤벨 벤치프레스', 'chest', 'dumbbell'),
    ('체스트프레스 머신', 'chest', 'machine'),
    ('펙덱 플라이', 'chest', 'machine'),
    ('케이블 플라이', 'chest', 'cable'),
    ('딥스', 'chest', 'bodyweight'),
    ('푸시업', 'chest', 'bodyweight'),
    ('풀업', 'back', 'bodyweight'),
    ('랫풀다운', 'back', 'machine'),
    ('바벨 로우', 'back', 'barbell'),
    ('덤벨로우', 'back', 'dumbbell'),
    ('원암 덤벨로우', 'back', 'dumbbell'),
    ('인클라인 덤벨로우', 'back', 'dumbbell'),
    ('시티드 케이블 로우', 'back', 'cable'),
    ('T바 로우', 'back', 'machine'),
    ('머신 로우', 'back', 'machine'),
    ('스트레이트암 풀다운', 'back', 'cable'),
    ('롱풀', 'back', 'machine'),
    ('바벨 오버헤드프레스', 'shoulders', 'barbell'),
    ('덤벨 숄더프레스', 'shoulders', 'dumbbell'),
    ('머신 숄더프레스', 'shoulders', 'machine'),
    ('사이드 레터럴 레이즈', 'shoulders', 'dumbbell'),
    ('리어델트 플라이', 'shoulders', 'machine'),
    ('페이스풀', 'shoulders', 'cable'),
    ('프론트 레이즈', 'shoulders', 'dumbbell'),
    ('바벨 컬', 'biceps', 'barbell'),
    ('EZ바 컬', 'biceps', 'barbell'),
    ('덤벨 컬', 'biceps', 'dumbbell'),
    ('해머 컬', 'biceps', 'dumbbell'),
    ('프리처 컬', 'biceps', 'machine'),
    ('케이블 컬', 'biceps', 'cable'),
    ('케이블 푸시다운', 'triceps', 'cable'),
    ('오버헤드 익스텐션', 'triceps', 'cable'),
    ('스컬크러셔', 'triceps', 'barbell'),
    ('클로즈그립 벤치프레스', 'triceps', 'barbell'),
    ('머신 트라이셉스 익스텐션', 'triceps', 'machine'),
    ('크런치', 'abs', 'bodyweight'),
    ('케이블 크런치', 'abs', 'cable'),
    ('레그레이즈', 'abs', 'bodyweight'),
    ('행잉 레그레이즈', 'abs', 'bodyweight'),
    ('플랭크', 'abs', 'bodyweight'),
    ('앱도미널 머신', 'abs', 'machine'),
    ('백스쿼트', 'quads', 'barbell'),
    ('프론트스쿼트', 'quads', 'barbell'),
    ('레그프레스', 'quads', 'machine'),
    ('핵스쿼트', 'quads', 'machine'),
    ('런지', 'quads', 'dumbbell'),
    ('불가리안 스플릿 스쿼트', 'quads', 'dumbbell'),
    ('레그 익스텐션', 'quads', 'machine'),
    ('데드리프트', 'hamstrings', 'barbell'),
    ('루마니안 데드리프트', 'hamstrings', 'barbell'),
    ('레그 컬', 'hamstrings', 'machine'),
    ('힙 쓰러스트', 'hamstrings', 'barbell'),
    ('굿모닝', 'hamstrings', 'barbell'),
    ('글루트햄 레이즈', 'hamstrings', 'bodyweight'),
    ('백 익스텐션', 'hamstrings', 'bodyweight')
)
insert into public.exercise_definitions (owner_user_id, name, primary_body_part_id, exercise_type, is_system)
select null, seed.name, body_parts.id, seed.exercise_type, true
from exercise_seed seed
join public.body_parts body_parts on body_parts.key = seed.body_part_key
where not exists (
  select 1
  from public.exercise_definitions exercises
  where exercises.owner_user_id is null
    and lower(exercises.name) = lower(seed.name)
);

with machine_seed(brand_name, machine_name, body_part_key) as (
  values
    ('DRAX', 'Incline Chest Press', 'chest'),
    ('Matrix', 'Lat Pulldown', 'back'),
    ('Technogym', 'Shoulder Press', 'shoulders'),
    ('Newtech', '45 Leg Press', 'quads'),
    ('DRAX', 'Seated Leg Curl', 'hamstrings'),
    ('Hammer Strength', 'Iso-Lateral Row', 'back')
)
insert into public.machine_definitions (owner_user_id, brand_id, brand_name_fallback, name, primary_body_part_id, is_system)
select null, brands.id, null, seed.machine_name, body_parts.id, true
from machine_seed seed
join public.brand_definitions brands on brands.owner_user_id is null and brands.name = seed.brand_name
join public.body_parts body_parts on body_parts.key = seed.body_part_key
where not exists (
  select 1
  from public.machine_definitions machines
  where machines.owner_user_id is null
    and lower(machines.name) = lower(seed.machine_name)
);

with template_seed(machine_name, field_key, field_label, field_type, options_json, sort_order) as (
  values
    ('Incline Chest Press', 'seat_height', '안장 높이', 'dropdown', '["1","2","3","4","5","6","7","8","9","10"]'::jsonb, 1),
    ('Incline Chest Press', 'pad_position', '패드 위치', 'dropdown', '["1","2","3","4","5"]'::jsonb, 2),
    ('Incline Chest Press', 'angle', '각도', 'number', null, 3),
    ('Lat Pulldown', 'seat_height', '안장 높이', 'dropdown', '["1","2","3","4","5","6","7","8","9","10"]'::jsonb, 1),
    ('Lat Pulldown', 'handle_position', '손잡이 위치', 'dropdown', '["1","2","3","4","5","6","7"]'::jsonb, 2),
    ('Shoulder Press', 'seat_height', '안장 높이', 'dropdown', '["1","2","3","4","5","6","7","8","9","10"]'::jsonb, 1),
    ('Shoulder Press', 'backrest_position', '등받이 위치', 'dropdown', '["1","2","3","4","5","6"]'::jsonb, 2),
    ('45 Leg Press', 'seat_height', '안장 높이', 'dropdown', '["1","2","3","4","5","6","7","8","9","10"]'::jsonb, 1),
    ('45 Leg Press', 'footplate_position', '발판 위치', 'dropdown', '["1","2","3","4","5","6","7"]'::jsonb, 2),
    ('45 Leg Press', 'angle', '각도', 'number', null, 3),
    ('Seated Leg Curl', 'seat_height', '안장 높이', 'dropdown', '["1","2","3","4","5","6","7","8","9","10"]'::jsonb, 1),
    ('Seated Leg Curl', 'pad_position', '패드 위치', 'dropdown', '["1","2","3","4","5"]'::jsonb, 2),
    ('Iso-Lateral Row', 'seat_height', '안장 높이', 'dropdown', '["1","2","3","4","5","6","7","8","9","10"]'::jsonb, 1),
    ('Iso-Lateral Row', 'handle_position', '손잡이 위치', 'dropdown', '["1","2","3","4","5","6","7"]'::jsonb, 2)
)
insert into public.machine_setting_templates (machine_id, field_key, field_label, field_type, options_json, sort_order)
select machines.id, seed.field_key, seed.field_label, seed.field_type, seed.options_json, seed.sort_order
from template_seed seed
join public.machine_definitions machines on machines.owner_user_id is null and machines.name = seed.machine_name
where not exists (
  select 1
  from public.machine_setting_templates templates
  where templates.machine_id = machines.id
    and templates.field_key = seed.field_key
);
