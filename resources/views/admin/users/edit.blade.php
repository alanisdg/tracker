@extends('layouts.admin')

@section('content')
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-8">
            <div class="card">
            <div class="card-header">Editar usuario {{$user->name}}</div>

                <div class="card-body">
                    <form method="POST" action="{{ route('admin.users.update',$user->id)}}">
                        <div class="form-group">
                            <label for="email-input">Correo</label>
                            <input
                            id="email"
                            class="form-control"
                            @error('email') is-invalid @enderror
                            type="email"
                            value="{{$user->email}}"
                            required
                            autocomplete="email"
                            autofocus
                            name="email">

                            @error('email')
                            <span class="invalid-feedback" role="alert">
                                <strong>{{$message}}</strong>
                            </span>
                            @enderror

                            <label for="email-input">Nombre</label>
                            <input
                            id="email"
                            class="form-control"
                            @error('email') is-invalid @enderror
                            type="text"
                            value="{{$user->name}}"
                            required
                            autocomplete="email"
                            autofocus
                            name="name">

                            @error('email')
                            <span class="invalid-feedback" role="alert">
                                <strong>{{$message}}</strong>
                            </span>
                            @enderror

                        </div>
                        @csrf
                        {{ method_field('PUT')}}
                        @foreach($roles as $role)
                        <div class="form-check">
                        <input id="my-input" class="form-check-input" type="checkbox" name="roles[]" value="{{$role->id }}"
                            @if($user->roles->pluck('id')->contains($role->id) ) checked @endif
                        >
                            <label for="my-input" class="form-check-label">{{$role->name }}</label>
                        </div>
                        @endforeach
                        <button class="btn btn-primary" type="submit">Actualizar</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
