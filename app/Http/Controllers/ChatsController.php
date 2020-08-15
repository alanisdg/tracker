<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Message;
class ChatsController extends Controller
{
    public function __construct(){
        $this->middleware('auth');
    }

    public function index(){
        return view('chat.index');
    }

    public function fetchMessages(){
        return Message::with('user')->get();
    }

    public function sendMessage(Request $request){
        auth()->user()->messages()->create([
            'message'=> $request->message
        ]);
        return ['status' =>'ok'];
    }

}
