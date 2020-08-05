<?php

use Illuminate\Database\Seeder;
use App\User;
use App\Role;
class UsersTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        User::truncate();
        DB::table('role_user')->truncate();
        $adminRole = Role::where('name','admin')->first();
        $authorRole = Role::where('name','author')->first();
        $monitoristaRole = Role::where('name','monitorista')->first();

        $admin = User::create([
            'name' => 'Admin User',
            'email'=> 'admin@admin.com',
            'password'=> Hash::make('password')
        ]);

        $author = User::create([
            'name' => 'Author User',
            'email'=> 'author@ahutor.com',
            'password'=> Hash::make('password')
        ]);

        $monitorista = User::create([
            'name' => 'Monitorista User',
            'email'=> 'monitorista@monitorista.com',
            'password'=> Hash::make('password')
        ]);

        $admin->roles()->attach($adminRole);
        $author->roles()->attach($authorRole);
        $monitorista->roles()->attach($monitoristaRole);
    }
}
