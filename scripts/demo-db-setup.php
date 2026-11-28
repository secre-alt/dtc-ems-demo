<?php

// Prepares a SEPARATE demo database for recording the full enrollment flow.
//
//   php scripts/demo-db-setup.php C:\path\to\centralized_enrollment_for_DTC
//
// It creates <app>/.env.demo (if missing), creates a "<name>_demo" database,
// migrates it, adds fictional staff accounts and class sections, and writes
// demo.local.json for the recorder. It refuses to touch any other database.

function stop(string $message): never
{
    fwrite(STDERR, "STOPPED: {$message}\n");
    exit(1);
}

function envValue(string $env, string $key): string
{
    return preg_match('/^'.$key.'=(.*)$/m', $env, $m) ? trim($m[1], " \t\r\"'") : '';
}

$appPath = realpath($argv[1] ?? '') ?: stop('Pass the path to the Laravel app folder.');
if (! is_file("{$appPath}/artisan") || ! is_file("{$appPath}/.env")) {
    stop('That folder has no artisan file and .env.');
}
if (is_file("{$appPath}/bootstrap/cache/config.php")) {
    stop('Config is cached, so .env.demo would be ignored. Run "php artisan config:clear" in the app first.');
}

$mainEnv = file_get_contents("{$appPath}/.env");
$mainDatabase = envValue($mainEnv, 'DB_DATABASE');

if (! is_file("{$appPath}/.env.demo")) {
    if (! preg_match('/^[A-Za-z0-9_]+$/', $mainDatabase)) {
        stop('DB_DATABASE in .env is not a simple MySQL name. Create .env.demo yourself with a database ending in _demo.');
    }
    $demoEnv = $mainEnv;
    $overrides = [
        'APP_ENV' => 'demo',
        'APP_URL' => 'http://127.0.0.1:8001',
        'DB_DATABASE' => preg_replace('/_demo$/', '', $mainDatabase).'_demo',
        'DATABASE_URL' => '',
        'DB_URL' => '',
        'MAIL_MAILER' => 'log',
        'MAIL_LOG_CHANNEL' => 'single',
        'LOG_CHANNEL' => 'single',
        'LOG_LEVEL' => 'debug',
        'QUEUE_CONNECTION' => 'sync',
        // Keeps the demo from sharing cached roles with your main app.
        'CACHE_DRIVER' => 'array',
        'CACHE_STORE' => 'array',
        'SESSION_DRIVER' => 'file',
        // Cookies ignore the port, so the demo needs its own cookie name.
        'SESSION_COOKIE' => 'dtc_demo_session',
    ];
    foreach ($overrides as $key => $value) {
        $line = "{$key}={$value}";
        $demoEnv = preg_match("/^{$key}=.*$/m", $demoEnv)
            ? preg_replace("/^{$key}=[^\r\n]*/m", $line, $demoEnv)
            : rtrim($demoEnv)."\n{$line}\n";
    }
    file_put_contents("{$appPath}/.env.demo", $demoEnv);
    echo "Created .env.demo\n";
}

// .env.demo holds your app key and database password: keep it out of Git
// without editing any tracked file.
$exclude = "{$appPath}/.git/info/exclude";
if (is_file($exclude) && ! preg_match('/^\.env\.demo\s*$/m', file_get_contents($exclude))) {
    file_put_contents($exclude, "\n.env.demo\n", FILE_APPEND);
}

putenv('APP_ENV=demo');
$_ENV['APP_ENV'] = $_SERVER['APP_ENV'] = 'demo';
require "{$appPath}/vendor/autoload.php";
$app = require "{$appPath}/bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

$connection = config('database.default');
$settings = config("database.connections.{$connection}");
$database = (string) ($settings['database'] ?? '');

if (! $app->environment('demo')) {
    stop('The app did not start in the demo environment.');
}
if (! in_array($settings['driver'] ?? '', ['mysql', 'mariadb'], true)) {
    stop('This setup supports MySQL or MariaDB only.');
}
if (! preg_match('/^[A-Za-z0-9_]+_demo$/', $database) || $database === $mainDatabase) {
    stop("The demo database must be separate and end in _demo. Got \"{$database}\".");
}
if (! empty($settings['url'])) {
    stop('A database URL overrides the database name. Blank DATABASE_URL and DB_URL in .env.demo.');
}
if (config('mail.default') !== 'log') {
    stop('MAIL_MAILER in .env.demo must be log, so no real email is sent.');
}

$socket = $settings['unix_socket'] ?? '';
$dsn = $socket
    ? "mysql:unix_socket={$socket}"
    : "mysql:host={$settings['host']};port={$settings['port']}";
(new PDO($dsn, $settings['username'], $settings['password'] ?? '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]))
    ->exec("CREATE DATABASE IF NOT EXISTS `{$database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
DB::purge($connection);

if (DB::connection()->getDatabaseName() !== $database) {
    stop('Connected to an unexpected database.');
}
if (Schema::hasTable('users')
    && DB::table('users')->where('email', 'not like', '%@example.test')->exists()) {
    stop("\"{$database}\" already has accounts that are not demo accounts. Nothing was changed.");
}

echo "Migrating {$database}...\n";
if (Artisan::call('migrate', ['--force' => true]) !== 0) {
    stop("Migration failed:\n".Artisan::output());
}

$password = fn () => 'Dm!'.bin2hex(random_bytes(8));
$accounts = [];

DB::transaction(function () use (&$accounts, $password) {
    foreach (['admin', 'registrar', 'cashier', 'new_applicant', 'student', 'alumni'] as $role) {
        Spatie\Permission\Models\Role::firstOrCreate(['name' => $role]);
    }

    foreach (['registrar' => 'Demo Registrar', 'cashier' => 'Demo Cashier'] as $role => $name) {
        $email = "demo.{$role}@example.test";
        $secret = $password();
        $user = App\Models\User::where('email', $email)->first() ?? new App\Models\User();
        $user->forceFill([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($secret),
            'status' => 'active',
            'email_verified_at' => now(),
        ])->save();
        $user->syncRoles([$role]);
        $accounts[$role] = ['email' => $email, 'password' => $secret];
    }

    foreach ([
        'current_school_year' => '2026-2027',
        'current_semester' => '1st',
        'enrollment_fee' => '500',
    ] as $key => $value) {
        App\Models\Setting::set($key, $value);
    }

    $program = App\Models\Program::firstOrCreate(['code' => 'BSIS'], ['name' => 'BS Information Systems']);

    App\Models\CourseSubject::unguarded(fn () => collect([
        ['CC101', 'Introduction to Computing'],
        ['CC102', 'Computer Programming 1'],
        ['MATH101', 'Mathematics in the Modern World'],
        ['GE101', 'Purposive Communication'],
    ])->each(fn ($row) => App\Models\CourseSubject::firstOrCreate(
        ['program_id' => $program->id, 'subject_code' => $row[0]],
        ['subject_name' => $row[1], 'units' => 3, 'year_level' => 1, 'semester' => 1],
    )));

    // One section for each first-year subject, with no overlapping times.
    // These are plain sections (no published timetable), so the enrollment
    // waits for the Registrar to assign them, which the video shows.
    $subjects = App\Models\CourseSubject::where('program_id', $program->id)
        ->where('year_level', 1)->where('semester', 1)->orderBy('id')->get();
    if ($subjects->count() > 12) {
        throw new RuntimeException('Too many first-year subjects to schedule without conflicts.');
    }
    $slots = [];
    foreach (['MWF', 'TTH'] as $days) {
        foreach ([7, 9, 11, 13, 15, 17] as $hour) {
            $slots[] = [$days, sprintf('%02d:30:00', $hour), sprintf('%02d:00:00', $hour + 2)];
        }
    }
    foreach ($subjects as $index => $subject) {
        [$days, $start, $end] = $slots[$index];
        App\Models\ClassSchedule::updateOrCreate(
            [
                'course_subject_id' => $subject->id,
                'section_code' => 'BSIS-1A',
                'school_year' => '2026-2027',
                'semester' => 1,
            ],
            [
                'capacity' => 40,
                'is_active' => true,
                'day_pattern' => $days,
                'time_start' => $start,
                'time_end' => $end,
                'room' => 'Room '.(101 + $index),
                'instructor_name' => 'Demo Instructor',
            ],
        );
    }
});

$config = [
    'syntheticDataOnly' => true,
    'baseUrl' => 'http://127.0.0.1:8001',
    'mailLog' => str_replace('\\', '/', storage_path('logs/laravel.log')),
    'program' => 'BS Information Systems',
    'applicantPassword' => $password(),
    'registrar' => $accounts['registrar'],
    'cashier' => $accounts['cashier'],
];
file_put_contents(dirname(__DIR__).'/demo.local.json', json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n");

echo "Demo database \"{$database}\" is ready. Wrote demo.local.json (private, ignored by Git).\n";
