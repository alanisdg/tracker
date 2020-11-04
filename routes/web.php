<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});
Route::resource('mabe','MabeController');
Auth::routes();

Route::get('/home', 'HomeController@index')->name('home');
Route::get('/admin', 'AdminController@index')->name('admin');
Route::get('/chats', 'ChatsController@index')->name('chats');
Route::get('/messages', 'ChatsController@fetchMessages');
Route::get('/saveDevice', 'DevicesController@store');
//Route::get('/mabe', 'DevicesController@mabe');
Route::get('/dev', 'DevicesController@dev');
Route::post('/messages', 'ChatsController@sendMessage');

Route::namespace('Admin')->prefix('admin')->name('admin.')->middleware('can:manage-users')->group(function(){
    Route::resource('/users','UsersController',['except'=>['show','create','store']]);
});
