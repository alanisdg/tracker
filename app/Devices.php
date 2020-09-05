<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Devices extends Model
{
    protected $fillable = ['name','imei'];

    public function clients(){
        return $this->belongsToMany(Clients::class);
    }



    public function users(){
        return $this->belongsToMany(Users::class);
    }

}
