<?php

namespace App\Http\Controllers;
use App\Devices;

use Illuminate\Http\Request;

class DevicesController extends Controller
{
    public function store(){
        $device = Devices::create([
            'name' => '202',
            'imei' => '12321312312'
        ]);

        $id = 1;
        $device->clients()->sync($id);
        dd('ya');
        //flash('Device '.request()->get('name').' creada!');
        return redirect()->to('dashboard/devices');
    }
    public function dev(){
        dd(0);
    }
}
