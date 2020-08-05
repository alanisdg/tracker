@extends('layouts.admin')

@section('content')
<main class="page-content">
    <div class="container-fluid">

        <div class="row justify-content-center">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header">Users</div>

                    <div class="card-body">
                        <table class="table table-hover table-sm ">
                            <thead>
                              <tr>
                                <th scope="col">#</th>
                                <th scope="col">Nombre</th>
                                <th scope="col">Correo</th>
                                <th scope="col">Roles</th>
                                <th scope="col">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                                @foreach($users as $user)
                              <tr>
                                <th scope="row">{{$user->id}}</th>
                                <td>{{$user->name}}</td>
                                <td>{{$user->email}}</td>
                                <td>{{ implode(',',$user->roles()->get()->pluck('name')->toArray()) }}</td>
                                <td>
                                @can('edit-users')
                                <a href="{{ route('admin.users.edit', $user->id) }}">
                                  <button  class="btn btn-primary float-left">Editar</button>
                                </a>
                                @endcan
                                @can('delete-users')
                                <form method="post" class="float-left" action="{{ route('admin.users.destroy',$user->id)}}">
                                  @csrf
                                  {{method_field('DELETE')}}
                                    <button class="btn btn-danger ">Eliminar</button>
                                </form>
                                @endcan

                                </td>
                              </tr>
                              @endforeach
                            </tbody>
                          </table>



                    </div>
                </div>
            </div>
        </div>





    </div>





</div>
</main>
@endsection
