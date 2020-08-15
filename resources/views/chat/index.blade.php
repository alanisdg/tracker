@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-8">
            <div id="chat"></div>
        </div>
    </div>
</div>
<script src="js/app.js"></script>
<script>
    console.log('aqui')
    Echo.channel('home').listen('NewMessage', (e)=>{
        console.log(e.message);
    })
</script>
@endsection
